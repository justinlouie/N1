import _ from 'underscore'
import React from 'react';
import moment from 'moment'
import {RetinaImg} from 'nylas-component-kit'
import EventDatetimeInput from './event-datetime-input'
import {PLUGIN_ID} from './scheduler-constants'
import {
  Utils,
  Calendar,
  AccountStore,
  DatabaseStore} from 'nylas-exports';

export default class NewEventCard extends React.Component {
  static displayName = 'NewEventCard';

  static propTypes = {
    event: React.PropTypes.object.isRequired,
    draft: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func.isRequired,
    onParticipantsClick: React.PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this._mounted = false;
    this.state = {
      expanded: false,
      calendars: [],
    };
  }

  componentDidMount() {
    this._mounted = true;
    this._loadCalendars(this.props);
  }

  componentWillReceiveProps(newProps) {
    this._loadCalendars(newProps);
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _loadCalendars(props) {
    const account = AccountStore.accountForEmail(props.draft.from[0].email);
    DatabaseStore.findAll(Calendar, {accountId: account.id})
    .then((calendars) => {
      if (!this._mounted || !calendars) { return }
      this.setState({calendars: calendars.filter(c => !c.readOnly)})
    });
  }

  _renderIcon(name) {
    return (<span className="field-icon">
      <RetinaImg name={name} mode={RetinaImg.Mode.ContentPreserve} />
    </span>)
  }

  _renderParticipants() {
    const to = this.props.draft.to || [];
    const from = this.props.draft.from || [];
    return to.concat(from).map(r => r.name).join(", ")
  }

  _renderExpanded() {
    return (
      <span>
        <div className="row description">
          {this._renderIcon("ic-eventcard-notes@2x.png")}

          <input type="text"
            name="description"
            placeholder="Add notes"
            value={this.props.event.description}
            onChange={ e => this.props.onChange({description: e.target.value}) }
          />
        </div>

        <div className="row link">
          {this._renderIcon("ic-eventcard-link@2x.png")}
          <input type="text"
            name="description"
            placeholder="Add links"
            value={this.props.event.link}
            onChange={ e => this.props.onChange({link: e.target.value}) }
          />
        </div>
        <div className="row reminder">
          {this._renderIcon("ic-eventcard-reminder@2x.png")}

          <input type="text"
            name="description"
            placeholder="Add reminders"
            value={this.props.event.reminders}
            onChange={ e => this.props.onChange({reminders: e.target.value}) }
          />
        </div>
      </span>
)
  }

  _renderCollapsed() {
    const ic = this._renderIcon("ic-eventcard-disclosure@2x.png");
    const onClick = () => {this.setState({expanded: true})}
    return (
      <div className="row expand" onClick={onClick}>
        {ic}
        Add reminders, notes, links...
      </div>
    )
  }

  _renderCalendarPicker() {
    if (this.state.calendars.length <= 1) {
      return false;
    }
    const calOpts = this.state.calendars.map(cal =>
      <option value={cal.serverId}>{cal.name}</option>
    );
    const onChange = (e) => {this.props.onChange({calendarId: e.target.value})}
    return (
      <div className="row calendar">
        {this._renderIcon("ic-eventcard-calendar@2x.png")}
        <select onChange={onChange}>{calOpts}</select>
      </div>
    )
  }

  _onProposeTimes = () => {
    NylasEnv.newWindow({
      title: "Calendar",
      windowType: "calendar",
      windowProps: {
        draftClientId: this.props.draft.clientId,
      },
    });
  }

  _renderProposalsForDay(proposalsForDay) {
    return proposalsForDay.map((p) => {
      return (
        <div className="proposal" key={p.start}>
          {moment.unix(p.start).format("LT")}
          &nbsp;&mdash;&nbsp;
          {moment.unix(p.end).add(1, 'second').format("LT")}
        </div>
      )
    })
  }

  _renderProposals(proposals) {
    const byDay = _.groupBy(proposals, (p) => {
      return moment.unix(p.start).dayOfYear()
    })
    const renderedByDay = _.map(byDay, (ps, dayNum) => {
      const header = moment().dayOfYear(dayNum).format("ddd, MMM D")
      return (
        <div className="proposal-day" key={dayNum}>
          <div className="day-header">{header}</div>
          <div className="proposals">
            {this._renderProposalsForDay(ps)}
          </div>
        </div>
      )
    })
    return (
      <div className="row proposals">
        {this._renderIcon("ic-eventcard-time@2x.png")}
        <span>Proposed times:</span>
        <div className="proposals-wrap">
          {renderedByDay}
        </div>
      </div>
    )
  }

  _renderTimePicker() {
    const metadata = this.props.draft.metadataForPluginId(PLUGIN_ID);
    if (metadata && metadata.proposals) {
      return this._renderProposals(metadata.proposals)
    }
    return (
      <div className="row time">
        {this._renderIcon("ic-eventcard-time@2x.png")}
        <span>
          <EventDatetimeInput name="start"
            value={this.props.event.start}
            onChange={ date => this.props.onChange({start: date}) }
          />
          -
          <EventDatetimeInput name="end"
            reversed
            value={this.props.event.end}
            onChange={ date => this.props.onChange({end: date}) }
          />
          <span className="timezone">
            {moment().tz(Utils.timeZone).format("z")}
          </span>
        </span>
      </div>
    )
  }

  _renderSuggestPrompt() {
    const metadata = this.props.draft.metadataForPluginId(PLUGIN_ID);
    if (metadata && metadata.proposals) {
      return (
        <div className="suggest-times">
          <a onClick={this._onProposeTimes}>Select different times…</a>
        </div>
      )
    }
    return (
      <div className="suggest-times">
        or: <a onClick={this._onProposeTimes}>Suggest several times…</a>
      </div>
    )
  }

  render() {
    let title = this.props.event.title;
    if (title == null) {
      title = this.props.draft.subject;
    }

    return (
      <div className="new-event-card">
        <div className="remove-button" onClick={this.props.onRemove}>✕</div>
        <div className="row title">
          {this._renderIcon("ic-eventcard-description@2x.png")}
          <input type="text"
            name="title"
            placeholder="Add an event title"
            value={title}
            onChange={e => this.props.onChange({title: e.target.value}) }
          />
        </div>

        {this._renderTimePicker()}

        {this._renderSuggestPrompt()}

        {this._renderCalendarPicker()}

        <div className="row recipients">
          {this._renderIcon("ic-eventcard-people@2x.png")}
          <div onClick={this.props.onParticipantsClick()}>{this._renderParticipants()}</div>
        </div>

        <div className="row location">
          {this._renderIcon("ic-eventcard-location@2x.png")}
          <input type="text"
            name="location"
            placeholder="Add a location"
            value={this.props.event.location}
            onChange={e => this.props.onChange({location: e.target.value}) }
          />
        </div>

        {this.state.expanded ? this._renderExpanded() : this._renderCollapsed()}
      </div>
    )
  }
}
