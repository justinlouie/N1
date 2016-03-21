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

  static propTypes = {
    headerControls: React.PropTypes.func,
    footerControls: React.PropTypes.func,
    interactionHandlers: React.PropTypes.func,
    additionalDataSource: React.PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      currentView: NylasCalendar.WEEK_VIEW,
      selectedMoment: moment(),
    };
  }

  _viewComponent(VIEW) {
    const components = {}
    components[NylasCalendar.WEEK_VIEW] = WeekView
    components[NylasCalendar.MONTH_VIEW] = MonthView
    return components[VIEW]
  }

  _changeCurrentView = (currentView) => {
    this.setState({currentView});
  }

  _changeSelectedMoment = (newMoment) =>{
    this.setState({selectedMoment: newMoment})
  }

  _pluginProps() {
    const pluginProps = {}
    const pluginPropNames = [
      "headerControls",
      "footerControls",
      "interactionHandlers",
      "additionalDataSource",
    ]
    const args = {
      currentView: this.state.currentView,
      selectedMoment: this.state.selectedMoment,
    }
    for (const propName of pluginPropNames) {
      if (this.props[propName]) {
        try {
          const data = this.props[propName](args)
          pluginProps[propName] = data
        } catch (e) {
          NylasEnv.reportError(e)
        }
      }
    }
    return pluginProps
  }

  static containerStyles = {
    height: "100%",
  }

  render() {
    const CurrentView = this._viewComponent(this.state.currentView);
    return (
      <div className="nylas-calendar">
        <CurrentView
          selectedMoment={this.state.selectedMoment}
          changeCurrentView={this._changeCurrentView}
          changeSelectedMoment={this._changeSelectedMoment}
          {...this._pluginProps()} />
      </div>
    )
  }
}
NylasCalendar.WEEK_VIEW = "WEEK_VIEW"
NylasCalendar.MONTH_VIEW = "MONTH_VIEW"
