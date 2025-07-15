const ndlReq = require('../modules/needleSend');
const { controller } = require('../modules/name-routs-streams');

jest.mock('../modules/needleSend');

describe('name-routs-streams controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calls needleReq with fixed url', () => {
    ndlReq.needleReq.mockImplementation(() => {});
    controller(() => {});
    expect(ndlReq.needleReq).toHaveBeenCalled();
    const params = ndlReq.needleReq.mock.calls[0][0];
    expect(params.url).toBe('http://localhost:3000/channels-url');
    expect(params.method).toBe('GET');
  });

  test('invokes callback with apTV data on 200', () => {
    const data = {some: 'value'};
    ndlReq.needleReq.mockImplementation((p,cb) => cb({statusCode:200, body:{apTV:data}}));
    const cl = jest.fn();
    controller(cl);
    expect(cl).toHaveBeenCalledWith(data);
  });

  test('does not invoke callback when response undefined', () => {
    ndlReq.needleReq.mockImplementation((p,cb) => cb(undefined));
    const cl = jest.fn();
    controller(cl);
    expect(cl).not.toHaveBeenCalled();
  });
});
