import { Router } from 'express';
import * as views from './views';
import useAsync from './modules/use-async';

export default Router()
    .get('/home', useAsync(views.home))
    .get('/categories', useAsync(views.getCategories))
    .post('/categories', useAsync(views.createCategory))
    .put('/categories/:id', useAsync(views.updateCategory))
    .delete('/categories/:id', useAsync(views.deleteCategory))
    .get('/keywords', useAsync(views.getKeywords))
    .post('/keywords', useAsync(views.createKeyword))
    .delete('/keywords/:id', useAsync(views.deleteKeyword));
