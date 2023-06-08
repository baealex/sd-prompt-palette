import { Router } from '~/modules/core/router';
import { Link } from './index';

describe('new Link', () => {
    test('render test', () => {
        new Link(document.body, {
            text: 'Go to Link',
            href: '/test'
        });

        expect(document.body.textContent)
            .toContain('Go to Link');
    });

    test('click link', () => {
        function Mock() {
            this.render = jest.fn();
        }

        new Router(document.body).routes('/test', Mock);

        new Link(document.body, {
            text: 'Go to Link',
            href: '/test'
        });

        document.body.querySelector('a').click();

        expect(window.location.pathname).toBe('/test');
    });
});
