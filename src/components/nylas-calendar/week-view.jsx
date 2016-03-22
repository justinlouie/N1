import _ from 'underscore'
import Rx from 'rx-lite'
import React from 'react'
import moment from 'moment'
import classnames from 'classnames'
import {RetinaImg} from 'nylas-component-kit'
import {Event, Utils, Matcher, DatabaseStore} from 'nylas-exports'

import TopBanner from './top-banner'
import EventGridBg from './event-grid-bg'
import HeaderControls from './header-controls'
import FooterControls from './footer-controls'
import WeekViewEventColumn from './week-view-event-column'
import WeekViewAllDayEvents from './week-view-all-day-events'
import CalendarMouseHandler from './calendar-mouse-handler'

const overlapsBounds = Utils.overlapsBounds;

export default class WeekView extends React.Component {
  static displayName = "WeekView";

  static propTypes = {
    selectedMoment: React.PropTypes.instanceOf(moment).isRequired,
    headerControls: React.PropTypes.shape({
      left: React.PropTypes.node,
      right: React.PropTypes.node,
    }),
    footerControls: React.PropTypes.shape({
      left: React.PropTypes.node,
      right: React.PropTypes.node,
    }),
    changeCurrentView: React.PropTypes.func,
    interactionHandlers: React.PropTypes.objectOf(React.PropTypes.func),
    changeSelectedMoment: React.PropTypes.func,
    additionalDataSource: React.PropTypes.instanceOf(Rx.Observable),
  }

  static defaultProps = {
    changeCurrentView: () => {},
    changeSelectedMoment: () => {},
  }

  constructor(props) {
    super(props);
    this.DAYS_IN_VIEW = 7;
    this.BUFFER_DAYS = 7; // in each direction
    this.MIN_INTERVAL_HEIGHT = 21;
    this.INTERVAL_TIME = moment.duration(30, 'minutes').as('seconds');
    this.DAY_DUR = moment.duration(1, 'day').as('seconds');
    this._boundsCache = {}
    this.TODAY_DAY_OF_YEAR = moment().dayOfYear()
    this.TODAY_YEAR = moment().year()
    this.state = {
      events: [],
      additionalData: [],
      intervalHeight: this.MIN_INTERVAL_HEIGHT,
    }
  }

  componentWillMount() {
    this._boundsCache = {}
    this._sub = this._calEventSubscription(this.props)
  }

  componentDidMount() {
    this._centerScrollRegion()
    this._setIntervalHeight()
    const weekStart = moment(this._startMoment(this.props)).add(this.BUFFER_DAYS, 'days').unix()
    this._scrollTime = weekStart
    this._ensureHorizontalScrollPos()
    window.addEventListener('resize', this._setIntervalHeight, true)
  }

  componentWillReceiveProps(props) {
    this._boundsCache = {}
    if (this._sub) { this._sub.dispose() }
    this._sub = this._calEventSubscription(props)
  }

  componentDidUpdate() {
    this._ensureHorizontalScrollPos()
  }

  componentWillUnmount() {
    this._sub.dispose();
    window.removeEventListener('resize', this._setIntervalHeight)
  }

  _calEventSubscription(props) {
    const end = Event.attributes.end
    const start = Event.attributes.start
    const weekStart = this._startMoment(props).unix()
    const weekEnd = this._endMoment(props).unix()

    const matcher = new Matcher.Or([
      new Matcher.And([start.lte(weekEnd), end.gte(weekStart)]),
      new Matcher.And([start.lte(weekEnd), start.gte(weekStart)]),
      new Matcher.And([end.gte(weekStart), end.lte(weekEnd)]),
      new Matcher.And([end.gte(weekEnd), start.lte(weekStart)]),
    ]);

    const query = DatabaseStore.findAll(Event).where(matcher)
    const $sets = [Rx.Observable.fromQuery(query)]

    if (this.props.additionalDataSource) {
      $sets.push(this.props.additionalDataSource)
    }

    Rx.Observable.combineLatest($sets).subscribe(this._onEventsChange)
  }

  _startMoment(props) {
    if (!this._boundsCache.start) {
      // NOTE: weekday is Locale aware
      this._boundsCache.start = moment([props.selectedMoment.year()]).weekday(0).week(props.selectedMoment.week()).subtract(this.BUFFER_DAYS, 'days')
    }
    return this._boundsCache.start
  }

  _endMoment(props) {
    if (!this._boundsCache.end) {
      this._boundsCache.end = moment(this._startMoment(props)).add(this.BUFFER_DAYS * 2 + this.DAYS_IN_VIEW, 'days').subtract(1, 'millisecond')
    }
    return this._boundsCache.end
  }

  _onEventsChange = (dataSources = []) => {
    let events = dataSources[0]
    if (events.length === 0) {
      events = this.state.events;
    }
    const additionalData = dataSources[1]
    if (additionalData.length > 0) {
      events = events.concat(additionalData)
    }
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
    return (this.TODAY_DAY_OF_YEAR === day.dayOfYear() && this.TODAY_YEAR === day.year())
  }

  _renderEventColumn = (eventsByDay, day) => {
    const dayUnix = day.unix();
    const events = eventsByDay[dayUnix]
    return (
      <WeekViewEventColumn day={day} dayEnd={dayUnix + this.DAY_DUR - 1}
                           key={day.valueOf()}
                           events={events}
                           eventOverlap={this._eventOverlap(events)}/>

    )
  }

  // _renderAllDayEvents(allDayEvents, allDayOverlap) {
  //   const eventComponents = allDayEvents.map((e) => {
  //     return (
  //       <CalendarEvent event={e} order={allDayOverlap[e.id].order}
  //         key={e.id}
  //         scopeStart={this._startMoment(this.props).unix()}
  //         scopeEnd={this._endMoment(this.props).unix()}
  //         direction="horizontal"
  //         fixedMinorDimension={this.MIN_INTERVAL_HEIGHT}
  //         concurrentEvents={allDayOverlap[e.id].concurrentEvents}/>
  //     );
  //   });
  //   const height = this._allDayEventHeight(allDayOverlap)
  //   return <div className="all-day-events" style={{height}}>{eventComponents}</div>
  // }

  _allDayEventHeight(allDayOverlap) {
    return (this._maxConcurrentEvents(allDayOverlap) * this.MIN_INTERVAL_HEIGHT) + 1
  }

  // _eventsForDay(day) {
  //   const bounds = {
  //     start: day.unix(),
  //     end: this._dayEnd(day),
  //   }
  //   return _.filter(this.state.events, (event) => {
  //     return overlapsBounds(bounds, event) && !event.isAllDay()
  //   });
  // }
  //
  // _allDayEvents() {
  //   const bounds = {
  //     start: this._startMoment(this.props).unix(),
  //     end: this._endMoment(this.props).unix(),
  //   }
  //   return _.filter(this.state.events, (event) => {
  //     return overlapsBounds(bounds, event) && event.isAllDay()
  //   });
  // }
  //
  // _dayEnd(day) {
  //   return moment(day).add(1, 'day').subtract(1, 'second').unix()
  // }

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
          overlapById[e.id] = {concurrentEvents: 1, order: null}
          startedEvents.push(e)
        }
        if (e.end === t) {
          startedEvents = _.reject(startedEvents, (o) => o.id === e.id)
        }
      }
      for (const e of startedEvents) {
        if (!overlapById[e.id]) { overlapById[e.id] = {} }
        const numEvents = this._findMaxConcurrent(startedEvents, overlapById);
        overlapById[e.id].concurrentEvents = numEvents;
        if (overlapById[e.id].order === null) {
          // Dont' re-assign the order.
          const order = this._findAvailableOrder(startedEvents, overlapById);
          overlapById[e.id].order = order;
        }
      }
    }
    return overlapById
  }

  _findMaxConcurrent(startedEvents, overlapById) {
    let max = 1;
    for (const e of startedEvents) {
      max = Math.max((overlapById[e.id].concurrentEvents || 1), max);
    }
    return Math.max(max, startedEvents.length)
  }

  _findAvailableOrder(startedEvents, overlapById) {
    const orders = startedEvents.map((e) => overlapById[e.id].order);
    let order = 1;
    while (true) {
      if (orders.indexOf(order) === -1) { return order }
      order += 1;
    }
  }

  _maxConcurrentEvents(eventOverlap) {
    let maxConcurrent = -1;
    _.each(eventOverlap, ({concurrentEvents}) => {
      maxConcurrent = Math.max(concurrentEvents, maxConcurrent)
    })
    return maxConcurrent
  }

  _days() {
    const start = this._startMoment(this.props);
    const days = []
    for (let i = 0; i < (this.DAYS_IN_VIEW + this.BUFFER_DAYS * 2); i++) {
      // moment::weekday is locale aware since some weeks start on diff
      // days. See http://momentjs.com/docs/#/get-set/weekday/
      days.push(moment(start).weekday(i))
    }
    return days
  }

  _currentWeekText() {
    const start = moment(this._startMoment(this.props)).add(this.BUFFER_DAYS, 'days');
    const end = moment(this._endMoment(this.props)).subtract(this.BUFFER_DAYS, 'days');
    return `${start.format("MMMM D")} - ${end.format("MMMM D YYYY")}`
  }

  _leftHeaderControls() {
    if ((this.props.headerControls || {}).left) {
      return this.props.headerControls.left
    }
    return (
      <button className="btn" onClick={this._onClickToday}>
        Today
      </button>
    );
  }

  _rightHeaderControls() {
    if ((this.props.headerControls || {}).right) {
      return this.props.headerControls.right
    }
    return (
      <button className="btn">
        <RetinaImg name="ic-calendar-month.png"
                   mode={RetinaImg.Mode.ContentIsMask}/>
      </button>
    );
  }

  _leftFooterControls() {
    if ((this.props.footerControls || {}).left) {
      return this.props.footerControls.left
    }
    return false
  }

  _rightFooterControls() {
    if ((this.props.footerControls || {}).right) {
      return this.props.footerControls.right
    }
    return false
  }

  _onClickToday = () => {
    this.props.changeSelectedMoment(moment())
  }

  _onClickNextWeek = () => {
    const newMoment = moment(this.props.selectedMoment).add(1, 'week')
    this.props.changeSelectedMoment(newMoment)
  }

  _onClickPrevWeek = () => {
    const newMoment = moment(this.props.selectedMoment).subtract(1, 'week')
    this.props.changeSelectedMoment(newMoment)
  }

  _gridHeight() {
    return this.DAY_DUR / this.INTERVAL_TIME * this.state.intervalHeight
  }

  _centerScrollRegion() {
    const wrap = React.findDOMNode(this.refs.eventGridWrap);
    wrap.scrollTop = (this._gridHeight() / 2) - (wrap.getBoundingClientRect().height / 2);
  }

  *_tickGenerator({type}) {
    const height = this._gridHeight();
    const dayInSec = this.DAY_DUR;

    let step = this.INTERVAL_TIME;
    let stepStart = 0;

    // We only use a moment object so we can properly localize the "time"
    // part. The day is irrelevant. We just need to make sure we're
    // picking a non-DST boundary day.
    const start = moment([2015, 1, 1]);

    let duration = this.INTERVAL_TIME
    if (type === "major") {
      step = this.INTERVAL_TIME * 2;
      duration += this.INTERVAL_TIME
    } else if (type === "minor") {
      step = this.INTERVAL_TIME * 2;
      stepStart = this.INTERVAL_TIME;
      duration += this.INTERVAL_TIME
      start.add(this.INTERVAL_TIME, 'seconds');
    }

    const curTime = moment(start)
    for (let tsec = stepStart; tsec <= dayInSec; tsec += step) {
      const y = (tsec / dayInSec) * height;
      yield {time: curTime, yPos: y}
      curTime.add(duration, 'seconds')
    }
  }

  _setIntervalHeight = () => {
    const wrap = React.findDOMNode(this.refs.eventGridWrap);
    const wrapHeight = wrap.getBoundingClientRect().height;
    const numIntervals = Math.floor(this.DAY_DUR / this.INTERVAL_TIME);
    React.findDOMNode(this.refs.eventGridLegendWrap).style.height = `${wrapHeight}px`;
    this.setState({
      intervalHeight: Math.max(wrapHeight / numIntervals, this.MIN_INTERVAL_HEIGHT),
    });
  }

  _onGridScroll = (event) => {
    React.findDOMNode(this.refs.eventGridLegendWrap).scrollTop = event.target.scrollTop
  }

  _onScrollCalWrap = (event) => {
    if (!event.target.scrollLeft) { return }
    const percent = event.target.scrollLeft / event.target.scrollWidth
    const weekStart = this._startMoment(this.props).unix()
    const weekEnd = this._endMoment(this.props).unix()
    this._scrollTime = weekStart + ((weekEnd - weekStart) * percent)
    if (percent < 0.25) {
      this._onClickPrevWeek()
    } else if (percent + (this.DAYS_IN_VIEW / (this.BUFFER_DAYS * 2 + this.DAYS_IN_VIEW)) > 0.95) {
      this._onClickNextWeek()
    }
  }

  _ensureHorizontalScrollPos() {
    if (!this._scrollTime) return;
    const weekStart = this._startMoment(this.props).unix()
    const weekEnd = this._endMoment(this.props).unix()
    let percent = (this._scrollTime - weekStart) / (weekEnd - weekStart)
    percent = Math.min(Math.max(percent, 0), 1)
    const wrap = React.findDOMNode(this.refs.calendarAreaWrap)
    wrap.scrollLeft = wrap.scrollWidth * percent
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

  _bufferRatio() {
    return (this.BUFFER_DAYS * 2 + this.DAYS_IN_VIEW) / this.DAYS_IN_VIEW
  }

  _onMouseMove(args) {
    if (this.refs.eventGridBg) {
      this.refs.eventGridBg.mouseMove(args)
    }
  }

  _interactionHandlers() {
    const origHandler = this.props.interactionHandlers.onMouseMove;
    return Object.assign({}, this.props.interactionHandlers, {
      onMouseMove: (args) => {
        this._onMouseMove(args);
        if (origHandler) { origHandler(args) }
      },
    })
  }

  // We calculate events by days so we only need to iterate through all
  // events in the span once.
  _eventsByDay(days) {
    const map = {allDay: []};
    const unixDays = days.map((d) => d.unix());
    unixDays.forEach((d) => map[d] = []);
    for (const event of this.state.events) {
      if (event.isAllDay()) {
        map.allDay.push(event)
      } else {
        for (const day of unixDays) {
          const bounds = {
            start: day,
            end: day + this.DAY_DUR - 1,
          }
          if (overlapsBounds(bounds, event)) {
            map[day].push(event)
          }
        }
      }
    }
    return map
  }

  render() {
    const days = this._days();
    const eventsByDay = this._eventsByDay(days)
    const allDayOverlap = this._eventOverlap(eventsByDay.allDay);
    return (
      <div className="calendar-view week-view">
        <CalendarMouseHandler interactionHandlers={this._interactionHandlers()}>
          <TopBanner />

          <HeaderControls title={this._currentWeekText()}
            leftHeaderControls={this._leftHeaderControls()}
            rightHeaderControls={this._rightHeaderControls()}
            nextAction={this._onClickNextWeek}
            prevAction={this._onClickPrevWeek} />

          <div className="calendar-legend">
            <div className="date-label-legend" style={{height: this._allDayEventHeight(allDayOverlap) + 75 + 1}}>
              <span className="legend-text">All Day</span>
            </div>
            <div className="event-grid-legend-wrap" ref="eventGridLegendWrap">
              <div className="event-grid-legend" style={{height: this._gridHeight()}}>
                {this._renderEventGridLabels()}
              </div>
            </div>
          </div>

          <div className="calendar-area-wrap" ref="calendarAreaWrap"
               onScroll={this._onScrollCalWrap}>
            <div className="week-header" style={{width: `${this._bufferRatio() * 100}%`}}>
              <div className="date-labels">
                {days.map(this._renderDateLabel)}
              </div>

              <WeekViewAllDayEvents
                minorDim={this.MIN_INTERVAL_HEIGHT}
                end={this._endMoment(this.props).unix()}
                height={this._allDayEventHeight(allDayOverlap)}
                start={this._startMoment(this.props).unix()}
                allDayEvents={eventsByDay.allDay}
                allDayOverlap={allDayOverlap} />
            </div>

            <div className="event-grid-wrap" ref="eventGridWrap" onScroll={this._onGridScroll} style={{width: `${this._bufferRatio() * 100}%`}}>
              <div className="event-grid" style={{height: this._gridHeight()}}>
                {days.map(_.partial(this._renderEventColumn, eventsByDay))}
                <EventGridBg height={this._gridHeight()}
                             intervalHeight={this.state.intervalHeight}
                             numColumns={this.BUFFER_DAYS * 2 + this.DAYS_IN_VIEW}
                             ref="eventGridBg"
                             tickGenerator={this._tickGenerator.bind(this)}/>
              </div>
            </div>
          </div>

          <FooterControls leftFooterControls={this._leftFooterControls()}
              rightFooterControls={this._rightFooterControls()}/>
        </CalendarMouseHandler>
      </div>
    )
  }
}
