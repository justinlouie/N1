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
    /**
     * A function that is passed the `currentView`, the `selectedMoment`,
     * and should return components to render in the header.
     */
    headerComponentFactory: React.PropTypes.func,

    /**
     * A function that is passed the `currentView`, the `selectedMoment`,
     * and should return components to render in the footer.
     */
    footerComponentFactory: React.PropTypes.func,

    /**
     * A function that is passed the `currentView`, the `selectedMoment`,
     * and should return a CalendarDataSource
     */
    dataSourceGenerator: React.PropTypes.func,

    /**
     * The following are a set of supported interaction handlers.
     *
     * These are passed a custom set of arguments in a single object that
     * includes the `currentView` as well as things like the `time` at the
     * click coordinate.
     */
    onCalendarMouseDown: React.PropTypes.func,
    onCalendarMouseMove: React.PropTypes.func,
    onCalendarMouseUp: React.PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      currentView: NylasCalendar.WEEK_VIEW,
      selectedMoment: moment(),
    };
  }

  _getCurrentViewComponent() {
    const components = {}
    components[NylasCalendar.WEEK_VIEW] = WeekView
    components[NylasCalendar.MONTH_VIEW] = MonthView
    return components[this.state.currentView]
  }

  _changeCurrentView = (currentView) => {
    this.setState({currentView});
  }

  _changeSelectedMoment = (newMoment) =>{
    this.setState({selectedMoment: newMoment})
  }

  _headerComponentsForCurrentView() {

  }

  _footerComponentsForCurrentView() {

  }

  _dataSourceForCurrentView() {

  }

  _pluginProps() {
    const pluginProps = {}
    const pluginPropNames = [
      "headerComponents",
      "footerComponents",
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
    const CurrentView = this._getCurrentViewComponent();
    return (
      <div className="nylas-calendar">
        <CurrentView
          selectedMoment={this.state.selectedMoment}
          changeCurrentView={this._changeCurrentView}
          changeSelectedMoment={this._changeSelectedMoment}
          headerComponents={this._headerComponentsForCurrentView()}
          footerComponents={this._footerComponentsForCurrentView()}
          dataSource={this._dataSourceForCurrentView()}
          onCalendarMouseDown={this.props.onCalendarMouseDown}
          onCalendarMouseMove={this.props.onCalendarMouseMove}
          onCalendarMouseUp={this.props.onCalendarMouseUp} />
      </div>
    )
  }
}
NylasCalendar.WEEK_VIEW = "WEEK_VIEW"
NylasCalendar.MONTH_VIEW = "MONTH_VIEW"
