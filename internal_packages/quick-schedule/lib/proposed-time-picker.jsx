import Rx from 'rx-lite'
import React from 'react'
import {Utils} from 'nylas-exports'
import {NylasCalendar} from 'nylas-component-kit'
import ScheduleActions from './schedule-actions'
import ProposedTimeStore from './proposed-time-store'

/**
 * A an extended NylasCalendar that lets you pick proposed times.
 */
export default class ProposedTimePicker extends React.Component {
  static displayName = "ProposedTimePicker";

  constructor(props) {
    super(props);
    this.state = {
      duration: ProposedTimeStore.currentDuration(),
    }
  }

  componentDidMount() {
    this._usub = ProposedTimeStore.listen(() => {
      this.setState({duration: ProposedTimeStore.currentDuration()});
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (!Utils.isEqualReact(nextProps, this.props) ||
            !Utils.isEqualReact(nextState, this.state));
  }

  componentWillUnmount() {
    this._usub()
  }

  _dataSourceGenerator({currentView}) {
    return Rx.Observable.fromStore(ProposedTimeStore).map((store) => store.timeBlocksAsEvents())
  }

  _footerComponentFactory = ({currentView}) => {
    if (currentView !== NylasCalendar.WEEK_VIEW) { return null }
    return {
      left: this._leftFooterControls(),
      right: this._rightFooterControls(),
    }
  }

  _leftFooterControls() {
    const optComponents = ProposedTimeStore.DURATIONS.map((opt, i) => {
      return <option value={opt.join("|")} key={i}>{opt[2]}</option>
    })

    return (
      <div className="duration-picker">
        <label style={{paddingRight: 10}}>Event Duration:</label>
        <select value={this.state.duration.join("|")}
                onChange={this._onChangeDuration}>{optComponents}</select>
      </div>
    );
  }

  _rightFooterControls() {
    return (
      <button className="btn btn-emphasis" onClick={this._onDone}>
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
    if (!time || currentView !== NylasCalendar.WEEK_VIEW) { return null }
    ScheduleActions.addProposedTime(time)
  }

  _onCalendarMouseMove({time, mouseIsDown, currentView}) {
    if (!time || !mouseIsDown || currentView !== NylasCalendar.WEEK_VIEW) { return null }
    ScheduleActions.addProposedTime(time)
  }

  _onCalendarMouseDown({time, currentView}) {
    if (!time || currentView !== NylasCalendar.WEEK_VIEW) { return null }
    ScheduleActions.addProposedTime(time)
  }

  static containerStyles = {
    height: "100%",
  }

  render() {
    return (
      <NylasCalendar onCalendarMouseUp={this._onMouseUp}
                     onCalendarMouseDown={this._onMouseDown}
                     onCalendarMouseMove={this._onMouseMove}
                     dataSourceGenerator={this._dataSourceGenerator}
                     footerComponentFactory={this._footerComponentFactory}
                     />
    )
  }
}
