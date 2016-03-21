import React from 'react'
import moment from 'moment'
import ScheduleActions from './schedule-actions'
import {NylasCalendar} from 'nylas-component-kit'
// import ProposedTimeStore from './proposed-time-store'

export default class TimeProposingCalendar extends React.Component {
  static displayName = "TimeProposingCalendar";

  constructor(props) {
    super(props);
    this.state = {
      duration: moment.duration(1, 'hour').as('seconds'),
    }
  }

  _footerControls = ({currentView}) => {
    if (currentView !== NylasCalendar.WEEK_VIEW) { return null }
    return {
      left: this._leftFooterControls(),
      right: this._rightFooterControls(),
    }
  }

  _leftFooterControls() {
    const opts = [
      [15, 'minutes', '15 min'],
      [30, 'minutes', '30 min'],
      [50, 'minutes', '50 min'],
      [1, 'hour', '1 hr'],
      [1.5, 'hours', '1½ hr'],
      [2, 'hours', '2 hr'],
      [2.5, 'hours', '2½ hr'],
      [3, 'hours', '3 hr'],
    ]
    const optComponents = opts.map((opt) => {
      const d = moment.duration.apply(null, opt.slice(0, 2));
      return <option value={d.as('seconds')}>{opt[2]}</option>
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
    this.setState({duration: event.target.value});
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

  _onMouseUp(event, time) {
    if (!time) { return }
    ScheduleActions.paintTime(time)
  }

  _onMouseMove(event, time) {
    if (!time) { return }
    ScheduleActions.paintTime(time)
  }

  _onMouseDown(event, time) {
    if (!time) { return }
    ScheduleActions.paintTime(time)
  }

  _additionalDataSource() {
    return null
    // return ProposedTimeStore
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
