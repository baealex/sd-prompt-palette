import { RouterProvider } from '@tanstack/react-router';

import { ToastProvider } from '~/components/ui/ToastProvider';
import { router } from '~/router';

export const App = () => {
    return (
        <ToastProvider>
            <RouterProvider router={router} />
        </ToastProvider>
    );
};
