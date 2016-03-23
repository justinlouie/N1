/** @babel */
import _ from 'underscore'
import NylasStore from 'nylas-store'
import moment from 'moment'
import ScheduleActions from './schedule-actions'
import {Event, Message, Actions, NylasAPI, DatabaseStore} from 'nylas-exports'
import {PLUGIN_ID, PLUGIN_NAME} from './quick-schedule-constants'

require('moment-round')
/**
 * Maintains the creation of "Proposed Times" when scheduling with people.
 *
 * The proposed times are displayed in various calendar views.
 *
 */
class ProposedTimeStore extends NylasStore {
  CALENDAR_ID() { return "QUICK_SCHEDULE" }

  Durations() {
    return [
      [15, 'minutes', '15 min'],
      [30, 'minutes', '30 min'],
      [50, 'minutes', '50 min'],
      [1, 'hour', '1 hr'],
      [1.5, 'hours', '1½ hr'],
      [2, 'hours', '2 hr'],
      [2.5, 'hours', '2½ hr'],
      [3, 'hours', '3 hr'],
    ]
  }

  activate() {
    this._paintTimes = []
    this._choicesPending = false;
    // this.triggerLater = _.throttle(this.trigger, 32)
    this._duration = this.Durations()[3] // 1 hr
    this.unsubscribers = [
      ScheduleActions.paintTime.listen(this._onPaintTime),
      ScheduleActions.removeProposal.listen(this._onRemoveProposal),
      ScheduleActions.changeDuration.listen(this._onChangeDuration),
      ScheduleActions.confirmChoices.listen(this._onConfirmChoices),
    ]
  }

  choicesPending() {
    return this._choicesPending
  }

  deactivate() {
    this.unsubscribers.forEach(unsub => unsub())
  }

  currentDuration() {
    return this._duration
  }

  timeBlocks() {
    return _.groupBy(this._paintTimes, (t) => {
      const blockSize = this._duration.slice(0, 2)
      return moment(t).floor(blockSize[0], blockSize[1]).valueOf()
    })
  }

  timeBlocksAsEvents() {
    const blockSize = this._duration.slice(0, 2)
    return _.map(this.timeBlocks(), (data, start) => {
      return new Event().fromJSON({
        title: "Proposed Time",
        calendar_id: this.CALENDAR_ID(),
        when: {
          object: "timespan",
          start_time: moment(+start).unix(),
          end_time: moment(+start).add(blockSize[0], blockSize[1]).subtract(1, 'second').unix(),
        },
      })
    })
  }

  /**
   * Gets called with a new time as the user drags their mouse across the
   * event grid. This gets called on every mouse move and mouseup.
   */
  _onPaintTime = (newMoment) => {
    this._paintTimes.push(newMoment);
    this.trigger()
  }

  _onChangeDuration = (newDuration) => {
    this._duration = newDuration
    this.trigger()
  }

  _onRemoveProposal = () => {

  }

  _metadatFromChoices() {
    return this.timeBlocksAsEvents().map((e) => e.toJSON())
  }

  /**
   * This will bundle up and attach the choices as metadata on the draft.
   */
  _onConfirmChoices = () => {
    this._choicesPending = true;
    this.trigger();

    const {draftClientId} = NylasEnv.getWindowProps()

    DatabaseStore.find(Message, draftClientId).then((draft) => {
      NylasAPI.authPlugin(PLUGIN_ID, PLUGIN_NAME, draft.accountId)
      .then(() => {
        Actions.setMetadata(draft, PLUGIN_ID, this._metadatFromChoices())
      }).catch((error) => {
        NylasEnv.reportError(error);
        NylasEnv.showErrorDialog(`Sorry, we were unable to schedule this message. ${error.message}`);
      });
    });
  }
}

export default new ProposedTimeStore()
