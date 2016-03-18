import React from 'react'

export default class FooterControls extends React.Component {
  static displayName = "FooterControls";

  static propTypes = {
    leftFooterControls: React.PropTypes.node,
    rightFooterControls: React.PropTypes.node,
  }

  static defaultProps = {
    leftFooterControls: false,
    rightFooterControls: false,
  }

  render() {
    if (!this.props.leftFooterControls && !this.props.rightFooterControls) {
      return false
    }
    return (
      <div className="footer-controls">
        <div className="left-controls">
          {this.props.leftFooterControls}
        </div>
        <div className="center-controls">
        </div>
        <div className="right-controls">
          {this.props.rightFooterControls}
        </div>
      </div>
    )
  }
}
