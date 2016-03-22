/** @babel */
import _ from 'underscore'
import NylasStore from 'nylas-store'
import moment from 'moment'
import ScheduleActions from './schedule-actions'
import {Event} from 'nylas-exports'

require('moment-round')
/**
 * Maintains the creation of "Proposed Times" when scheduling with people.
 *
 * The proposed times are displayed in various calendar views.
 *
 */
class ProposedTimeStore extends NylasStore {
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
    // this.triggerLater = _.throttle(this.trigger, 32)
    this._duration = this.Durations()[3] // 1 hr
    this.unsubscribers = [
      ScheduleActions.paintTime.listen(this._onPaintTime),
      ScheduleActions.removeProposal.listen(this._onRemoveProposal),
      ScheduleActions.changeDuration.listen(this._onChangeDuration),
    ]
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
        calendar_id: "QUICK SCHEDULE",
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
}
export default new ProposedTimeStore()
