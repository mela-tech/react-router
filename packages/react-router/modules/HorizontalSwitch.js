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
    const { match, finalProps, index } = this.matchComponent(props);
    const childComponentsPath = match ? [{ index, finalProps }] : [];
    this.state = {
      childComponentsPath
    };
  }

  componentDidUpdate(prevProps) {
    if (__DEV__) {
      warning(
        !(this.props.location && !prevProps.location),
        '<HorizontalSwitch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
      );

      warning(
        !(!this.props.location && prevProps.location),
        '<HorizontalSwitch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
      );
    }

    if (prevProps.context !== this.props.context) {
      let { match, finalProps, index } = this.matchComponent(this.props);
      if (this.props.context.horizontalRouter) {
        if (this.props.context.horizontalRouter.action === "open") {
          this.open(this.props.context.horizontalRouter.horizontalRouteId, {
            index,
            finalProps
          });
        } else {
          this.close(this.props.context.horizontalRouter.horizontalRouteId, {
            index,
            finalProps
          });
        }
      } else if (match) {
        this.setState({ childComponentsPath: [{ index, finalProps }] });
      }
    }
  }

  matchComponent = props => {
    const { children, context } = props;
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
    const newArray = [
      ...this.state.childComponentsPath.splice(0, horizontalRouteId + 1),
      child
    ];
    this.setState({ childComponentsPath: newArray });
  };

  render() {
    invariant(
      this.props.context,
      "You should not use <HorizontalSwitch> outside a <Router>"
    );
    let prevPath = this.props.root ? this.props.root : "/";
    let prevSearch = "";
    let children = Array.isArray(this.props.children)
      ? this.props.children
      : [this.props.children];
    return this.state.childComponentsPath.map((c, index) => {
      const child = children[c.index];
      const horizontalRoute = {
        horizontalRouteId: index,
        prevPath,
        prevSearch
      };
      prevPath = c.finalProps.location.pathname;
      prevSearch = c.finalProps.location.search;
      return React.cloneElement(child, {
        ...c.finalProps,
        horizontalRoute,
        key: index
      });
    });
  }
}

if (__DEV__) {
  HorizontalSwitch.propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  };
}

const withContext = Element => {
  return React.forwardRef((props, ref) => {
    return (
      <RouterContext.Consumer>
        {context => <Element context={context} {...props} ref={ref} />}
      </RouterContext.Consumer>
    );
  });
};

export default withContext(HorizontalSwitch);
