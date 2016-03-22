import Rx from 'rx-lite'
import React from 'react'
import {Utils} from 'nylas-exports'
import {NylasCalendar} from 'nylas-component-kit'
import ScheduleActions from './schedule-actions'
import ProposedTimeStore from './proposed-time-store'

export default class TimeProposingCalendar extends React.Component {
  static displayName = "TimeProposingCalendar";

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

  _footerControls = ({currentView}) => {
    if (currentView !== NylasCalendar.WEEK_VIEW) { return null }
    return {
      left: this._leftFooterControls(),
      right: this._rightFooterControls(),
    }
  }

  _leftFooterControls() {
    const optComponents = ProposedTimeStore.Durations().map((opt) => {
      return <option value={opt.join(",")}>{opt[2]}</option>
    })

    return (
      <div className="duration-picker">
        <label style={{paddingRight: 10}}>Event Duration:</label>
        <select value={this.state.duration}
                onChange={this._onChangeDuration}>{optComponents}</select>
      </div>
    );
  }

  _onChangeDuration = (event) => {
    ScheduleActions.changeDuration(event.target.value.split(","))
  }

  _rightFooterControls() {
    return (
      <button className="btn btn-emphasis">
      Done
      </button>
    );
  }

  _interactionHandlers = ({currentView}) => {
    if (currentView !== NylasCalendar.WEEK_VIEW) { return null }
    return {
      onMouseDown: this._onMouseDown,
      onMouseMove: this._onMouseMove,
      onMouseUp: this._onMouseUp,
    }
  }

  _onMouseUp({time}) {
    if (!time) { return }
    ScheduleActions.paintTime(time)
  }

  _onMouseMove({time, mouseIsDown}) {
    if (!time || !mouseIsDown) { return }
    ScheduleActions.paintTime(time)
  }

  _onMouseDown({time}) {
    if (!time) { return }
    ScheduleActions.paintTime(time)
  }

  _additionalDataSource() {
    return Rx.Observable.fromStore(ProposedTimeStore).map((store) => store.timeBlocksAsEvents())
  }

  static containerStyles = {
    height: "100%",
  }

  render() {
    return (
      <NylasCalendar footerControls={this._footerControls}
                     interactionHandlers={this._interactionHandlers}
                     additionalDataSource={this._additionalDataSource} />
    )
  }
}
