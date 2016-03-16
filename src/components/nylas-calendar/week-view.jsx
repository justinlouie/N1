import _ from 'underscore'
import Rx from 'rx-lite'
import React from 'react'
import moment from 'moment'
import classnames from 'classnames'
import {RetinaImg} from 'nylas-component-kit'
import {Event, Matcher, DatabaseStore} from 'nylas-exports'

import TopBanner from './top-banner'
import CalendarEvent from './calendar-event'
import HeaderControls from './header-controls'
import FooterControls from './footer-controls'

export default class WeekView extends React.Component {
  static displayName = "WeekView";

  static propTypes = {
    currentMoment: React.PropTypes.instanceOf(moment).isRequired,
    changeCurrentView: React.PropTypes.func,
    changeCurrentMoment: React.PropTypes.func,
  }

  static defaultProps = {
    changeCurrentView: () => {},
    changeCurrentMoment: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      events: [],
      // weekOfYear starts at 1 and is locale dependent. See
      // http://momentjs.com/docs/#/get-set/week/
      weekOfYear: React.PropTypes.instanceOf(moment).isRequired,
    }
  }

  componentWillMount() {
    this._sub = this._calEventSubscription()
  }

  componentWillReceiveProps(props) {
    if (this._sub) { this._sub.dispose() }
    this._sub = this._calEventSubscription(props)
  }

  componentWillUnmount() {
    this._sub.dispose();
  }

  _calEventSubscription(props = this.props) {
    return Rx.Observable.fromQuery(
      DatabaseStore.findAll(Event).where(Matcher.Not(Matcher.Or([
        Event.attributes.end.lessThan(this._startMoment(props).unix()),
        Event.attributes.start.greaterThan(this._endMoment(props).unix()),
      ])))).subscribe(this._onEventsChange);
  }

  _startMoment(props) {
    return moment([moment().year()]).weekday(0).week(props.currentMoment.week())
  }

  _endMoment(props) {
    const weekOfYear = props.currentMoment.week()
    return this._startMoment(weekOfYear).week(weekOfYear + 1).subtract(1, 'millisecond')
  }

  _onEventsChange(events = []) {
    this.setState({events})
  }

  _renderDateLabel = (day) => {
    const className = classnames({
      "day-label-wrap": true,
      "is-today": this._isToday(day),
    })
    return (
      <div className={className}>
        <span className="date-label">{day.format("D")}</span>
        <span className="weekday-label">{day.format("ddd")}</span>
      </div>
    )
  }

  _isToday(day) {
    const now = moment();
    return (now.dayOfYear() === day.dayOfYear() && now.year() === day.year())
  }

  _renderEventColumn = (day) => {
    const events = this._eventsForDay(day);
    const eventOverlap = this._eventOverlap(events)
    const eventComponents = events.map((e) => {
      return (
        <CalendarEvent event={e} order={eventOverlap[e.id].order}
          dayStart={day.unix()}
          concurrentEvents={eventOverlap[e.id].concurrentEvents}/>
      );
    });
    return <div className="event-column">{eventComponents}</div>
  }

  _eventsForDay(day) {
    const dayStart = day.unix();
    const dayEnd = this._dayEnd(day)
    return _.filter(this.state.events, (event) => {
      return !(event.end < dayStart || event.start > dayEnd)
    })
  }

  _dayEnd(day) {
    return moment(day).add(1, 'day').subtract(1, 'second').unix()
  }

  /**
   * Computes the overlap between a set of events in O(n).
   *
   * Returns a hash keyed by event id whose value is an object:
   *   - concurrentEvents: number of concurrent events
   *   - order: the order in that series of concurrent events
   */
  _eventOverlap(events) {
    const times = {}
    for (const event of events) {
      if (!times[event.start]) { times[event.start] = [] }
      if (!times[event.end]) { times[event.end] = [] }
      times[event.start].push(event)
      times[event.end].push(event)
    }
    const sortedTimes = Object.keys(times).sort();
    const overlapById = {}
    let startedEvents = []
    for (const t of sortedTimes) {
      for (const e of times[t]) {
        if (e.start === t) {
          overlapById[e.id] = {}
          startedEvents.push(e)
        }
        if (e.end === t) {
          startedEvents = _.reject(startedEvents, (o) => o.id === e.id)
        }
      }
      let order = 1;
      for (const e of startedEvents) {
        if (!overlapById[e.id]) { overlapById[e.id] = {} }
        let numEvents = overlapById[e.id].concurrentEvents || 1;
        numEvents = Math.max(numEvents, startedEvents.length)
        overlapById[e.id].concurrentEvents = numEvents;
        overlapById[e.id].order = order;
        order += 1;
      }
    }
    return overlapById
  }

  _days() {
    const start = this._startMoment(this.props);
    const days = []
    const DAYS_IN_WEEK = 7;
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      // moment::weekday is locale aware since some weeks start on diff
      // days. See http://momentjs.com/docs/#/get-set/weekday/
      days.push(moment(start).weekday(i))
    }
    return days
  }

  _currentWeekText() {
    const start = this._startMoment(this.props);
    const end = this._endMoment(this.props);
    return `${start.format("MMMM D")} - ${end.format("MMMM D YYYY")}`
  }

  _leftHeaderControls() {
    return (
      <button className="btn" onClick={this._onClickToday}>
        <button className="btn">Today</button>
      </button>
    );
  }

  _rightHeaderControls() {
    return (
      <button className="btn">
        <RetinaImg name="ic-calendar-month.png"
                   mode={RetinaImg.Mode.ContentIsMask}/>
      </button>
    );
  }

  _onClickToday = () => {
    this.props.changeCurrentMoment(moment())
  }

  _onClickNextWeek = () => {
    const newMoment = this._startMoment(this.props).add(1, 'week')
    this.props.changeCurrentMoment(newMoment)
  }

  _onClickPrevWeek = () => {
    const newMoment = this._startMoment(this.props).subtract(1, 'week')
    this.props.changeCurrentMoment(newMoment)
  }

  _gridHeight() {
    const INTERVAL_HEIGHT = 20;
    const INTERVAL_TIME = moment.duration(30, 'minutes');
    return moment.duration(1, 'day').as('seconds') / INTERVAL_TIME.as('seconds') * INTERVAL_HEIGHT
  }

  render() {
    return (
      <div className="calendar-view week-view">
        <TopBanner />

        <HeaderControls title={this._currentWeekText()}
          leftHeaderControls={this._leftHeaderControls()}
          rightHeaderControls={this._rightHeaderControls()}
          nextAction={this._onClickNextWeek}
          prevAction={this._onClickPrevWeek} />

        <div className="date-labels">
          {this._days().map(this._renderDateLabel)}
        </div>

        <div className="event-grid" style={{height: this._gridHeight()}}>
          {this._days().map(this._renderEventColumn)}
        </div>

        <FooterControls />
      </div>
    )
  }
}
