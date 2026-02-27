import { RouterProvider } from '@tanstack/react-router';

import { ToastProvider } from '~/components/ui/ToastProvider';
import { router } from '~/router';
import { PathStoreProvider } from '~/state/path-store';

export const App = () => {
    return (
        <PathStoreProvider>
            <ToastProvider>
                <RouterProvider router={router} />
            </ToastProvider>
        </PathStoreProvider>
    );
};
