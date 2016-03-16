import React from 'react'
import {RetinaImg} from 'nylas-component-kit'

export default class HeaderControls extends React.Component {
  static displayName = "HeaderControls";

  static propTypes = {
    title: React.PropTypes.string,
    leftHeaderControls: React.PropTypes.node,
    rightHeaderControls: React.PropTypes.node,
  }

  static defaultProps = {
    leftHeaderControls: false,
    rightHeaderControls: false,
  }

  render() {
    return (
      <div className="header-controls">
        <div className="left-controls">
          {this.props.leftHeaderControls}
        </div>

        <div className="center-controls">
          <button className="btn btn-icon prev">
            <RetinaImg name="ic-calendar-left-arrow.png"
                       mode={RetinaImg.Mode.ContentIsMask}/>
          </button>

          <span className="title">{this.props.title}</span>

          <button className="btn btn-icon next">
            <RetinaImg name="ic-calendar-right-arrow.png"
                       mode={RetinaImg.Mode.ContentIsMask}/>
          </button>
        </div>

        <div className="right-controls">
          {this.props.rightHeaderControls}
        </div>
      </div>
    )
  }
}
