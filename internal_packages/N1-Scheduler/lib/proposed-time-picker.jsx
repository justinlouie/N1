import React from 'react'
import {Utils} from 'nylas-exports'
import {NylasCalendar} from 'nylas-component-kit'
import ScheduleActions from './schedule-actions'
import ProposedTimeStore from './proposed-time-store'
import ProposedTimeCalendarDataSource from './proposed-time-calendar-data-source'

/**
 * A an extended NylasCalendar that lets you pick proposed times.
 */
export default class ProposedTimePicker extends React.Component {
  static displayName = "ProposedTimePicker";

  static containerStyles = {
    height: "100%",
  }

  constructor(props) {
    super(props);
    this.state = {
      duration: ProposedTimeStore.currentDuration(),
      pendingSave: ProposedTimeStore.pendingSave(),
    }
  }

  componentDidMount() {
    this._usub = ProposedTimeStore.listen(() => {
      this.setState({
        duration: ProposedTimeStore.currentDuration(),
        pendingSave: ProposedTimeStore.pendingSave(),
      });
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (!Utils.isEqualReact(nextProps, this.props) ||
            !Utils.isEqualReact(nextState, this.state));
  }

  componentWillUnmount() {
    this._usub()
  }

  _dataSource() {
    return new ProposedTimeCalendarDataSource()
  }

  _footerComponents = () => {
    return {
      week: [this._leftFooterComponents(), this._rightFooterComponents()],
    }
  }

  _leftFooterComponents() {
    const optComponents = ProposedTimeStore.DURATIONS.map((opt, i) => {
      return <option value={opt.join("|")} key={i}>{opt[2]}</option>
    })

    return (
      <div key="dp" className="duration-picker" style={{order: -100}}>
        <label style={{paddingRight: 10}}>Event Duration:</label>
        <select value={this.state.duration.join("|")} onChange={this._onChangeDuration}>
          {optComponents}
        </select>
      </div>
    );
  }

  _rightFooterComponents() {
    return (
      <button key="done"
        style={{order: 100}}
        onClick={this._onDone}
        className="btn btn-emphasis"
        disabled={this.state.pendingSave}
      >
        Done
      </button>
    );
  }

  _onChangeDuration = (event) => {
    ScheduleActions.changeDuration(event.target.value.split(","))
  }

  _onDone = () => {
    ScheduleActions.confirmChoices()
  }

  _onCalendarMouseUp({time, currentView}) {
    if (!time || currentView !== NylasCalendar.WEEK_VIEW) { return }
    ScheduleActions.addProposedTime(time);
    return
  }

  _onCalendarMouseMove({time, mouseIsDown, currentView}) {
    if (!time || !mouseIsDown || currentView !== NylasCalendar.WEEK_VIEW) { return }
    ScheduleActions.addProposedTime(time);
    return
  }

  _onCalendarMouseDown({time, currentView}) {
    if (!time || currentView !== NylasCalendar.WEEK_VIEW) { return }
    ScheduleActions.addProposedTime(time);
    return
  }

  render() {
    return (
      <NylasCalendar
        dataSource={this._dataSource()}
        footerComponents={this._footerComponents()}
        onCalendarMouseUp={this._onCalendarMouseUp}
        onCalendarMouseDown={this._onCalendarMouseDown}
        onCalendarMouseMove={this._onCalendarMouseMove}
      />
    )
  }
}
