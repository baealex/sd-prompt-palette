import style from './style.module.scss';

interface Menu {
    label: string;
    click?: () => void;
    subMenus?: Pick<Menu, 'label' | 'click'>[];
}

interface ContextMenuOptions {
    top: number;
    left: number;
    menus: Menu[]
}

function createContextMenu() {
    let createdContextMenu = false;

    const destroyContextMenu = () => {
        document.querySelector(`.${style['context-menu']}`).remove();
        createdContextMenu = false;
    };

    document.addEventListener('click', () => {
        if (createdContextMenu) {
            destroyContextMenu();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (createdContextMenu) {
                destroyContextMenu();
            }
        }
    });

    return {
        create(options: ContextMenuOptions) {
            if (createdContextMenu) {
                destroyContextMenu();
            }

            const contextBox = document.createElement('ul');
            contextBox.className = style['context-menu'];
            contextBox.style.top = `${options.top + 4}px`;
            contextBox.style.left = `${options.left + 4}px`;

            options.menus.forEach(menu => {
                const menuItem = document.createElement('li');
                menuItem.className = style['context-menu-item'];
                menuItem.innerText = menu.label;

                if (menu.subMenus) {
                    menuItem.classList.add(style['sub-menu']);
                    menuItem.addEventListener('mouseenter', (e) => {
                        if (e.target !== menuItem) {
                            document
                                .querySelectorAll(`.${style['context-menu-sub']}`)
                                .forEach(sub => sub.remove());
                        }

                        const subContentBox = document.createElement('ul');
                        subContentBox.className = style['context-menu-sub'];
                        subContentBox.style.top = '0px';
                        subContentBox.style.left = 'calc(100% + 2px)';
                        menu.subMenus.forEach(subMenu => {
                            const subMenuItem = document.createElement('li');
                            subMenuItem.className = style['context-menu-item'];
                            subMenuItem.innerText = subMenu.label;
                            subMenuItem.addEventListener('click', subMenu.click);
                            subContentBox.appendChild(subMenuItem);
                        });
                        menuItem.appendChild(subContentBox);
                    });
                    contextBox.appendChild(menuItem);
                } else {
                    menuItem.addEventListener('mouseenter', () => {
                        document.querySelectorAll(`.${style['context-menu-sub']}`).forEach(sub => sub.remove());
                    });
                    menuItem.addEventListener('click', menu.click);
                    contextBox.appendChild(menuItem);
                }
            });

            document.body.appendChild(contextBox);
            createdContextMenu = true;
        },
        destroy: destroyContextMenu
    };
}

export const contextMenu = createContextMenu();
