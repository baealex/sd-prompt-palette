import { RouterProvider } from '@tanstack/react-router';

import { router } from '~/router';
import { PathStoreProvider } from '~/state/path-store';

export const App = () => {
    return (
        <PathStoreProvider>
            <RouterProvider router={router} />
        </PathStoreProvider>
    );
};
