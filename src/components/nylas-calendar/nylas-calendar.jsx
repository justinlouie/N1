/** @babel */

import React from 'react'
import moment from 'moment'
import WeekView from './week-view'
import MonthView from './month-view'

/**
 * Nylas Calendar
 *
 * DayView
 * WeekView
 * MonthView
 * YearView
 */
export default class NylasCalendar extends React.Component {
  static displayName = "NylasCalendar";

  constructor(props) {
    super(props);
    this.state = {
      currentView: WeekView,
      currentMoment: moment(),
    };
  }

  _changeCurrentView = (currentView) => {
    const lookup = {"WeekView": WeekView, "MonthView": MonthView};
    this.setState({currentView: lookup[currentView]});
  }

  _changeCurrentMoment = (newMoment) =>{
    this.setState({currentMoment: newMoment})
  }

  render() {
    return (
      <div className="nylas-calendar">
        <this.state.currentView
          currentMoment={this.state.currentMoment}
          changeCurrentView={this._changeCurrentView}
          changeCurrentMoment={this._changeCurrentMoment}/>
      </div>
    )
  }

}

