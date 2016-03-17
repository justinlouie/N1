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
    this.MIN_INTERVAL_HEIGHT = 20;
    this.INTERVAL_TIME = moment.duration(30, 'minutes');
    this.DAY_DUR = moment.duration(1, 'day')
    this.state = {
      events: [],
      // weekOfYear starts at 1 and is locale dependent. See
      // http://momentjs.com/docs/#/get-set/week/
      weekOfYear: React.PropTypes.instanceOf(moment).isRequired,
      intervalHeight: this.MIN_INTERVAL_HEIGHT,
    }
  }

  componentWillMount() {
    this._sub = this._calEventSubscription(this.props)
  }

  componentDidMount() {
    this._renderEventGridBg()
    this._centerScrollRegion()
    this._setIntervalHeight()
    window.addEventListener('resize', this._setIntervalHeight, true)
  }

  componentWillReceiveProps(props) {
    if (this._sub) { this._sub.dispose() }
    this._sub = this._calEventSubscription(props)
  }

  componentDidUpdate() {
    this._renderEventGridBg()
  }

  componentWillUnmount() {
    this._sub.dispose();
    window.removeEventListener('resize', this._setIntervalHeight)
  }

  _calEventSubscription(props) {
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
    return this._startMoment(props).week(weekOfYear + 1).subtract(1, 'millisecond')
  }

  _onEventsChange = (events = []) => {
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
    const eventOverlap = this._eventOverlap(events);
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
    const sortedTimes = Object.keys(times).map((k) => parseInt(k, 10)).sort();
    const overlapById = {}
    let startedEvents = []
    for (const t of sortedTimes) {
      for (const e of times[t]) {
        if (e.start === t) {
          overlapById[e.id] = {concurrentEvents: 1, order: 1}
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
        Today
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
    return this.DAY_DUR.as('seconds') / this.INTERVAL_TIME.as('seconds') * this.state.intervalHeight
  }

  _renderEventGridBg() {
    const canvas = React.findDOMNode(this.refs.eventGridBg);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const height = this._gridHeight();
    canvas.height = height;

    const doStroke = (type, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      for (const {yPos} of this._tickGenerator({type: type})) {
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
      }
      ctx.stroke();
    }

    doStroke("minor", "#f1f1f1"); // Minor Ticks
    doStroke("major", "#e0e0e0"); // Major ticks
  }

  _centerScrollRegion() {
    const wrap = React.findDOMNode(this.refs.eventGridWrap);
    wrap.scrollTop = (this._gridHeight() / 2) - (wrap.getBoundingClientRect().height / 2);
  }

  *_tickGenerator({type}) {
    const height = this._gridHeight();
    const dayInSec = this.DAY_DUR.as('seconds');
    const intervalSec = this.INTERVAL_TIME.as('seconds');

    let step = intervalSec;
    let stepStart = 0;

    // We only use a moment object so we can properly localize the "time"
    // part. The day is irrelevant. We just need to make sure we're
    // picking a non-DST boundary day.
    const start = moment([2015, 1, 1]);

    const duration = moment.duration(this.INTERVAL_TIME)
    if (type === "major") {
      step = intervalSec * 2;
      duration.add(this.INTERVAL_TIME) // edit in place
    } else if (type === "minor") {
      step = intervalSec * 2;
      stepStart = intervalSec;
      duration.add(this.INTERVAL_TIME) // edit in place
      start.add(this.INTERVAL_TIME);
    }

    const curTime = moment(start)
    for (let tsec = stepStart; tsec <= dayInSec; tsec += step) {
      const y = (tsec / dayInSec) * height;
      yield {time: curTime, yPos: y}
      curTime.add(duration)
    }
  }

  _setIntervalHeight = () => {
    const wrap = React.findDOMNode(this.refs.eventGridWrap);
    const numIntervals = Math.floor(this.DAY_DUR.as('seconds') / this.INTERVAL_TIME.as('seconds'));
    this.setState({
      intervalHeight: Math.max(wrap.getBoundingClientRect().height / numIntervals, this.MIN_INTERVAL_HEIGHT),
    });
  }

  _renderEventGridLabels() {
    const labels = []
    let centering = 0;
    for (const {time, yPos} of this._tickGenerator({type: "major"})) {
      const hr = time.format("LT"); // Locale time. 2:00 pm or 14:00
      const style = {top: yPos - centering}
      labels.push(<span className="legend-text" style={style}>{hr}</span>)
      centering = 8; // center all except the 1st one.
    }
    return labels.slice(0, labels.length - 1);
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
          <div className="date-label-legend"><span className="legend-text">All Day</span></div>
          {this._days().map(this._renderDateLabel)}
        </div>

        <div className="event-grid-wrap" ref="eventGridWrap">
          <div className="event-grid" style={{height: this._gridHeight()}}>
            <div className="event-grid-legend">{this._renderEventGridLabels()}</div>
            {this._days().map(this._renderEventColumn)}
            <canvas className="event-grid-bg" ref="eventGridBg" style={{width: "100%", height: this._gridHeight()}}></canvas>
          </div>
        </div>

        <FooterControls />
      </div>
    )
  }
}
