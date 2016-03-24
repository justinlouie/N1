import React from 'react'
import WeekView from './week-view'
import MonthView from './month-view'
import CalendarDataSource from './calendar-data-source'

/**
 * Nylas Calendar
 */
export default class NylasCalendar extends React.Component {
  static DAY_VIEW = "day"
  static WEEK_VIEW = "week"
  static MONTH_VIEW = "month"
  static YEAR_VIEW = "year"

  static displayName = "NylasCalendar";

  static propTypes = {
    /**
     * The data source that powers all of the views of the NylasCalendar
     */
    dataSource: React.PropTypes.instanceOf(CalendarDataSource).isRequired,

    /**
     * Any extra header components for each of the supported View types of
     * the NylasCalendar
     */
    headerComponents: React.PropTypes.shape({
      day: React.PropTypes.node,
      week: React.PropTypes.node,
      month: React.PropTypes.node,
      year: React.PropTypes.node,
    }),

    /**
     * Any extra footer components for each of the supported View types of
     * the NylasCalendar
     */
    footerComponents: React.PropTypes.shape({
      day: React.PropTypes.node,
      week: React.PropTypes.node,
      month: React.PropTypes.node,
      year: React.PropTypes.node,
    }),

    /**
     * The following are a set of supported interaction handlers.
     *
     * These are passed a custom set of arguments in a single object that
     * includes the `currentView` as well as things like the `time` at the
     * click coordinate.
     */
    onCalendarMouseUp: React.PropTypes.func,
    onCalendarMouseDown: React.PropTypes.func,
    onCalendarMouseMove: React.PropTypes.func,
  }

  static containerStyles = {
    height: "100%",
  }

  constructor(props) {
    super(props);
    this.state = {
      currentView: NylasCalendar.WEEK_VIEW,
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

  render() {
    const CurrentView = this._getCurrentViewComponent();
    return (
      <div className="nylas-calendar">
        <CurrentView
          dataSource={this.props.dataSource}
          headerComponents={this.props.headerComponents[this.state.currentView]}
          footerComponents={this.props.footerComponents[this.state.currentView]}
          changeCurrentView={this._changeCurrentView}
          onCalendarMouseUp={this.props.onCalendarMouseUp}
          onCalendarMouseDown={this.props.onCalendarMouseDown}
          onCalendarMouseMove={this.props.onCalendarMouseMove}
        />
      </div>
    )
  }
}
