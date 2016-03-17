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
      selectedMoment: moment(),
    };
  }

  _changeCurrentView = (currentView) => {
    const lookup = {"WeekView": WeekView, "MonthView": MonthView};
    this.setState({currentView: lookup[currentView]});
  }

  _changeSelectedMoment = (newMoment) =>{
    this.setState({selectedMoment: newMoment})
  }

  static containerStyles = {
    height: "100%",
  }

  render() {
    return (
      <div className="nylas-calendar">
        <this.state.currentView
          selectedMoment={this.state.selectedMoment}
          changeCurrentView={this._changeCurrentView}
          changeSelectedMoment={this._changeSelectedMoment}/>
      </div>
    )
  }
}

