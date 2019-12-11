import React from "react";
import PropTypes from "prop-types";

import { NavProgressContext } from "components/OldSideNav";
import { findActiveNode } from "helpers/dom";

const sortByPosition = (a, b) => {
  const aY = a.current.getBoundingClientRect().y;
  const bY = b.current.getBoundingClientRect().y;
  return aY - bY;
};
let lastScrollPosition = 0;

export const Provider = ({ children }) => {
  const [activeNode, setActiveNode] = React.useState();
  const [trackedElements, setTrackedElements] = React.useState([]);

  // We need to search backwards pretty frequently, so memoize it so we don't
  // generate a ton of garbage.
  const backwardsElements = React.useMemo(
    () => trackedElements.slice().reverse(),
    [trackedElements],
  );

  React.useEffect(() => {
    const handler = () => {
      // If we haven't scrolled at least 20 pixels, just bail.
      if (Math.abs(window.scrollY - lastScrollPosition) < 20) {
        return;
      }
      // A tracked element becomes "active" if it enters the part of the screen
      // that we consider to be the focal point—about a third of the screen,
      // offset from the top enough that it's definitely in view.
      // If we're scrolling up, then we're watching for elements to come down
      // from the top. If scrolling down, watching about the midpoint.
      const isScrollingDown = window.scrollY > lastScrollPosition;
      lastScrollPosition = window.scrollY;

      const newActiveNode = findActiveNode(trackedElements, isScrollingDown);
      if (newActiveNode && newActiveNode !== activeNode) {
        setActiveNode(newActiveNode);
      }
    };
    window.addEventListener("scroll", handler);
    handler();
    return () => {
      window.removeEventListener("scroll", handler);
    };
  }, [activeNode, backwardsElements, trackedElements]);

  const trackElement = React.useCallback(
    (ref) => {
      setTrackedElements((state) => [...state, ref].sort(sortByPosition));
    },
    [setTrackedElements],
  );
  const stopTrackingElement = React.useCallback(
    (ref) => {
      setTrackedElements((state) => state.filter((x) => x === ref));
    },
    [setTrackedElements],
  );

  const contextValue = React.useMemo(
    () => ({
      activeNode,
      stopTrackingElement,
      trackElement,
    }),
    [activeNode, stopTrackingElement, trackElement],
  );

  return (
    <NavProgressContext.Provider value={contextValue}>
      {children}
    </NavProgressContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
};
