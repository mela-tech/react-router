import React from "react";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import warning from "tiny-warning";

import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

/**
 * The public API for rendering the first <Route> that matches.
 */
class HorizontalSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      childComponentsPath: []
    };
  }

  componentWillMount() {
    let { match, finalProps, index } = this.matchComponent(
      this.props,
      this.context
    );
    this.setState({
      childComponentsPath: match ? [{ index, finalProps }] : []
    });
  }

  componentWillReceiveProps(nextProps, nextContext) {
    let { match, finalProps, index } = this.matchComponent(
      nextProps,
      nextContext
    );
    if (nextContext.horizontalRouter) {
      if (nextContext.horizontalRouter.action === "open") {
        this.open(nextContext.horizontalRouter.horizontalRouteId, {
          index,
          finalProps
        });
      } else {
        this.close(nextContext.horizontalRouter.horizontalRouteId, {
          index,
          finalProps
        });
      }
    } else {
      let oldChildComponentsPath = this.state.childComponentsPath;
      if (match) oldChildComponentsPath = [{ index, finalProps }];
      this.setState({ childComponentsPath: oldChildComponentsPath });
    }
  }

  matchComponent = (props, context) => {
    const { children } = props;
    const location = props.location || context.location;
    let match, child;
    let index = 0;
    let childIndex = 0;
    React.Children.forEach(children, element => {
      if (match == null && React.isValidElement(element)) {
        const {
          path: pathProp,
          exact,
          strict,
          sensitive,
          from
        } = element.props;
        const path = pathProp || from;
        child = element;
        childIndex = index;
        match = path
          ? matchPath(location.pathname, { path, exact, strict, sensitive })
          : context.match;
      }
      index++;
    });
    let finalProps = { location, computedMatch: match };
    return { match, child, finalProps, index: childIndex };
  };

  close = (horizontalRouteId, child) => {
    if (horizontalRouteId >= this.state.childComponentsPath.length) {
      this.setState({ childComponentsPath: [child] });
    } else {
      let oldChildComponentsPath = this.state.childComponentsPath;
      let newArray = [...oldChildComponentsPath].splice(0, horizontalRouteId);
      if (newArray.length === 0) {
        newArray = [child];
      }
      this.setState({ childComponentsPath: newArray });
    }
  };

  open = (horizontalRouteId, child) => {
    if (horizontalRouteId >= this.state.childComponentsPath.length) {
      horizontalRouteId = this.state.childComponentsPath.length - 1;
    }
    let oldChildComponentsPath = this.state.childComponentsPath;
    let newArray = [...oldChildComponentsPath].splice(0, horizontalRouteId + 1);
    newArray.push(child);
    this.setState({ childComponentsPath: newArray });
  };

  render() {
    invariant(
      this.context,
      "You should not use <HorizontalSwitch> outside a <Router>"
    );
    let prevPath = "/";
    let children = Array.isArray(this.props.children)
      ? this.props.children
      : [this.props.children];
    let childElements = this.state.childComponentsPath.map((c, index) => {
      let child = children[c.index];
      let horizontalRoute = {
        horizontalRouteId: index,
        prevPath: prevPath
      };
      prevPath = c.finalProps.location.pathname;
      return (
        <child.type
          key={index}
          {...child.props}
          {...c.finalProps}
          horizontalRoute={horizontalRoute}
        />
      );
    });
    return this.state.childComponentsPath.length ? childElements : null;
  }
}

HorizontalSwitch.contextType = RouterContext;

if (__DEV__) {
  HorizontalSwitch.propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  };

  HorizontalSwitch.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<HorizontalSwitch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<HorizontalSwitch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default HorizontalSwitch;
