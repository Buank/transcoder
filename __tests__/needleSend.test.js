const needle = require('needle');
const { needleReq } = require('../modules/needleSend');

jest.mock('needle');

describe('needleReq', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calls callback with undefined when response is undefined', () => {
    needle.request.mockImplementation((m,u,d,o,cb) => cb(null, undefined));
    const cb = jest.fn();
    needleReq({method:'GET', url:'http://test'}, cb);
    expect(cb).toHaveBeenCalledWith(undefined);
  });

  test('passes through successful response', () => {
    const resp = {statusCode: 200, body: {msg:'ok'}};
    needle.request.mockImplementation((m,u,d,o,cb) => cb(null, resp));
    const cb = jest.fn();
    needleReq({method:'GET', url:'http://test'}, cb);
    expect(cb).toHaveBeenCalledWith(resp);
  });

  test('passes through 204 response', () => {
    const resp = {statusCode: 204, body: {}};
    needle.request.mockImplementation((m,u,d,o,cb) => cb(null, resp));
    const cb = jest.fn();
    needleReq({method:'GET', url:'http://test'}, cb);
    expect(cb).toHaveBeenCalledWith(resp);
  });

  test('still calls callback on non-200/204 status', () => {
    const resp = {statusCode: 404, body: {}};
    needle.request.mockImplementation((m,u,d,o,cb) => cb(null, resp));
    const cb = jest.fn();
    needleReq({method:'GET', url:'http://test'}, cb);
    expect(cb).toHaveBeenCalledWith(resp);
  });

  test('does not call callback on 500', () => {
    const resp = {statusCode: 500, body: {}};
    needle.request.mockImplementation((m,u,d,o,cb) => cb(null, resp));
    const cb = jest.fn();
    needleReq({method:'GET', url:'http://test'}, cb);
    expect(cb).not.toHaveBeenCalled();
  });
});
