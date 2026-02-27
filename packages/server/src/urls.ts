import { Router } from 'express';
import * as views from './views';
import useAsync from './modules/use-async';

export default Router()
    .get('/home', useAsync(views.home))
    .post('/image/metadata', useAsync(views.parseImageMetadata))
    .post('/image', useAsync(views.uploadImage))
    .get('/live/status', useAsync(views.liveStatus))
    .get('/live/config', useAsync(views.getLiveConfig))
    .get('/live/config/directories', useAsync(views.listLiveDirectories))
    .put('/live/config', useAsync(views.updateLiveConfig))
    .post('/live/config/pick-dir', useAsync(views.pickLiveDirectory))
    .get('/live/images', useAsync(views.listLiveImages))
    .get('/live/images/:id/prompt', useAsync(views.getLiveImagePrompt))
    .get('/live/images/:id/metadata', useAsync(views.getLiveImageMetadata))
    .delete('/live/images/:id', useAsync(views.deleteLiveImage))
    .post('/live/sync', useAsync(views.syncLiveImages));
