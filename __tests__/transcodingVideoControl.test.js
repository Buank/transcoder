const dbModel = require('../db-model');
const { addToQueue } = require('../api/controllers/transcoding-video-control');

jest.mock('../db-model');

describe('addToQueue', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('does nothing if video already exists', async () => {
    dbModel.one.mockResolvedValue({id:1});
    const video = {uuid:'u', ext:'.mp4', resulotion:'720', id:123};
    console.log = jest.fn();
    await addToQueue(video);
    expect(dbModel.none).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Уже есть такое видео');
  });

  test('inserts into queue when new', async () => {
    dbModel.one.mockRejectedValue(new Error('not found'));
    dbModel.none.mockResolvedValue();
    const video = {uuid:'u', ext:'.mp4', resulotion:'720', id:456};
    await addToQueue(video);
    expect(dbModel.none).toHaveBeenCalled();
  });
});
