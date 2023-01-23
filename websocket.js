"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.WebSocketProvider = void 0;
var ethers_1 = require("ethers");
var fs = require("fs");
var WEBSOCKET_PING_INTERVAL = 3000;
var WEBSOCKET_PONG_TIMEOUT = 3000;
var WEBSOCKET_RECONNECT_DELAY = 100;
var WebSocketProviderClass = function () { return /** @class */ (function () {
    function class_1() {
    }
    return class_1;
}()); };
var WebSocketProvider = /** @class */ (function (_super) {
    __extends(WebSocketProvider, _super);
     function  WebSocketProvider(providerUrl,spot) {

        var _this = _super.call(this) || this;
        _this.providerUrl = providerUrl;
        _this.spot = spot;
        _this.events = [];
        _this.requests = {};
        _this.handler = {
            get: function (target, prop, receiver) {
                var value = target.provider && Reflect.get(target.provider, prop, receiver);
                return value instanceof Function ? value.bind(target.provider) : value;
            }
        };
        _this.create();
        return new Proxy(_this, _this.handler);
    }
    WebSocketProvider.prototype.create = function () {
        var _this = this;
        var _a, _b;
        if (this.provider) {
            this.events = __spreadArray(__spreadArray([], this.events, true), this.provider._events, true);
            this.requests = __assign(__assign({}, this.requests), this.provider._requests);
        }
        var provider = new ethers_1.ethers.providers.WebSocketProvider(this.providerUrl, (_b = (_a = this.provider) === null || _a === void 0 ? void 0 : _a.network) === null || _b === void 0 ? void 0 : _b.chainId);
        var pingInterval;
        var pongTimeout;
        provider._websocket.on('open', function () {
            pingInterval = setInterval(function () {
                provider._websocket.ping();
                fs.writeFile('./pingpong.txt', `${_this.spot}---${new Date().getTime()}----ping \n`, {flag: 'a',}, (err) => {
                    if (err) {
                      console.error(err)
                    }
                  })
                pongTimeout = setTimeout(function () { provider._websocket.terminate(); }, WEBSOCKET_PONG_TIMEOUT);
            }, WEBSOCKET_PING_INTERVAL);
            var event;
            while ((event = _this.events.pop())) {
                provider._events.push(event);
                provider._startEvent(event);
            }
            for (var key in _this.requests) {
                provider._requests[key] = _this.requests[key];
                provider._websocket.send(_this.requests[key].payload);
                delete _this.requests[key];
            }
        });
        provider._websocket.on('pong', function () {
            if (pongTimeout)
                clearTimeout(pongTimeout);
                fs.writeFile('./pingpong.txt', `${_this.spot}---${new Date().getTime()}----pong \n`, {flag: 'a',}, (err) => {
                    if (err) {
                      console.error(err)
                    }
                  })
        });
        provider._websocket.on('close', function (code) {
            provider._wsReady = false;
            if (pingInterval)
                clearInterval(pingInterval);
            if (pongTimeout)
                clearTimeout(pongTimeout);
            if (code !== 1000) {
                // setTimeout(() => this.create(), WEBSOCKET_RECONNECT_DELAY);
                fs.writeFile('./pingpong.txt', `${_this.spot}---${new Date().getTime()}----正在重连..... \n`, {flag: 'a',}, (err) => {
                    if (err) {
                      console.error(err)
                    }
                  })
                try {
                    _this.create();
                } catch(e){
                    console.log(e.name + ":" + e.message);
                }
                fs.writeFile('./pingpong.txt', `${_this.spot}---${new Date().getTime()}----重连成功！ \n`, {flag: 'a',}, (err) => {
                    if (err) {
                      console.error(err)
                    }
                  })
            }
        });
        this.provider = provider;
    };
    return WebSocketProvider;
}(WebSocketProviderClass()));
exports.WebSocketProvider = WebSocketProvider;
