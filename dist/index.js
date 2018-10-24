"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compose = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redux = require("redux");

Object.defineProperty(exports, "compose", {
  enumerable: true,
  get: function get() {
    return _redux.compose;
  }
});
exports.actionReducer = actionReducer;
exports.actionHandler = actionHandler;
exports.actionCreator = actionCreator;
exports.connect = connect;
exports.create = create;
exports.withReducer = withReducer;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require("react-redux");

var _reselect = require("reselect");

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var actions = {};
var actionHandlers = {};
var actionReducers = {};
var commonSelectors = {};
var defaultSelector = function defaultSelector(x) {
  return x;
};
var types = {
  init: "@@init",
  dispatch: "@@dispatch"
};
var uniqueId = new Date().getTime();

function generateType(obj) {
  if (!obj.type) {
    obj.type = "@@" + obj.name + "_" + uniqueId++;
  }
}

function createStateMapper(prop) {
  if (prop[0] === "@") {
    prop = prop.substr(1);
    return function (state, props) {
      return props[prop];
    };
  }
  return function (state) {
    return state[prop];
  };
}

function defaultMiddleware(store) {
  return function (next) {
    return function (action) {
      if (action.handler && action.handler.toString() in actionHandlers) {
        return actionHandlers[action.handler](store, next, action);
      }
      return next(action);
    };
  };
}

/**
 * register dynamic action reducer
 * @param reducer
 * @returns {string}
 */
function actionReducer(reducer) {
  if (typeof reducer !== "function") {
    reducer = (0, _redux.combineReducers)(reducer);
  }

  generateType(reducer);

  actionReducers[reducer.type] = reducer;

  return reducer.type;
}

/**
 * register dynamic action handler
 * @param handler
 */
function actionHandler(handler) {
  generateType(handler);

  actionHandlers[handler.type] = handler;

  return handler.type;
}

function actionCreator(action) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // single action creator
  if (typeof action === "function") {
    generateType(action);

    var actionMetadata = actions[action.type];
    if (!actionMetadata) {
      actions[action.type] = actionMetadata = {
        handler: action,
        creator: function creator(payload, extraProps) {
          return Object.assign({ type: action.type, payload: payload }, options, extraProps);
        }
      };
    }

    return actionMetadata.creator;
  }
  // support multiple action creators
  var actionCreators = {};
  Object.entries(action).forEach(function (pair) {
    return actionCreators[pair[0]] = actionCreator(pair[1], options);
  });
  return actionCreators;
}

function connect(mapStateToProps) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (mapStateToProps) {
    // support named props
    if (typeof mapStateToProps === "string") {
      var props = mapStateToProps.split(/\s+/);
      var structuredSelector = {};
      props.forEach(function (prop) {
        return structuredSelector[prop[0] === "@" ? prop.substr(1) : prop] = commonSelectors[prop] || (commonSelectors[prop] = (0, _reselect.createSelector)(createStateMapper(prop), defaultSelector));
      });
      mapStateToProps = structuredSelector;
    }
    if (typeof mapStateToProps !== "function") {
      return _reactRedux.connect.apply(undefined, [(0, _reselect.createStructuredSelector)(mapStateToProps)].concat(args));
    }
  }

  return _reactRedux.connect.apply(undefined, [mapStateToProps].concat(args));
}

function create() {
  var initialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var currentReducer = void 0;
  var registeredReducers = {};

  var lazyDispatch = function lazyDispatch(state) {
    for (var _len3 = arguments.length, actions = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      actions[_key3 - 1] = arguments[_key3];
    }

    return { type: types.dispatch, state: state, actions: actions };
  };
  var defaultReducer = function defaultReducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    // is custom action
    if (action.type in actions) {
      var _actionHandler = actions[action.type].handler;
      var actionResult = _actionHandler(state, action.payload, lazyDispatch);

      if (actionResult && actionResult.type === types.dispatch) {
        setTimeout(function () {
          actionResult.actions.forEach(function (action) {
            return store.dispatch(action);
          });
        }, 0);
        state = actionResult.state;
      } else {
        state = actionResult;
      }
    }

    if (action.reducer in actionReducers) {
      var _actionReducer = actionReducers[action.reducer];
      state = _actionReducer(state, action);
    }

    return currentReducer ? currentReducer(state, action) : state;
  };

  for (var _len2 = arguments.length, middlewares = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    middlewares[_key2 - 1] = arguments[_key2];
  }

  var store = (0, _redux.createStore)(defaultReducer, _redux.applyMiddleware.apply(undefined, _toConsumableArray([defaultMiddleware].concat(middlewares))));

  var app = Object.assign({}, store, {
    // register reducer
    reducer: function reducer(_reducer) {
      if (typeof _reducer !== "function") {
        _reducer = (0, _redux.combineReducers)(_reducer);
      }

      generateType(_reducer);

      if (_reducer.type in registeredReducers) return;

      registeredReducers[_reducer.type] = true;

      if (currentReducer) {
        var prevReducer = currentReducer;
        currentReducer = function currentReducer(state, action) {
          return _reducer(prevReducer(state, action), action);
        };
      } else {
        currentReducer = _reducer;
      }

      // dispatch init method after reducer added
      store.dispatch({ type: types.init });
    },
    Provider: function Provider(props) {
      return _react2.default.createElement(_reactRedux.Provider, Object.assign({ store: app }, props));
    }
  });

  return app;
}

function withReducer(reducer) {
  if (typeof reducer !== "function") {
    reducer = (0, _redux.combineReducers)(reducer);
  }

  return function (WrappedComponent) {
    var ReducerInjector = function (_React$Component) {
      _inherits(ReducerInjector, _React$Component);

      function ReducerInjector() {
        _classCallCheck(this, ReducerInjector);

        return _possibleConstructorReturn(this, (ReducerInjector.__proto__ || Object.getPrototypeOf(ReducerInjector)).apply(this, arguments));
      }

      _createClass(ReducerInjector, [{
        key: "render",
        value: function render() {
          this.context.store.reducer(reducer);
          return _react2.default.createElement(WrappedComponent, this.props);
        }
      }]);

      return ReducerInjector;
    }(_react2.default.Component);

    ReducerInjector.contextTypes = {
      store: _propTypes2.default.object.isRequired
    };

    ReducerInjector.displayName = "withReducer(" + (WrappedComponent.displayName || WrappedComponent.name || "Component") + ")";
    return ReducerInjector;
  };
}

exports.default = create;
//# sourceMappingURL=index.js.map