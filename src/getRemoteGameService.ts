import { IframeMessagingProvider } from '@daocasino/platform-messaging/lib.browser/IframeMessagingProvider';
import { GameService } from './gameService';

const REQUEST_TIMEOUT = 30000;

// call on iframe
export async function getRemoteGameSerivce(
    requestTimeout: number = REQUEST_TIMEOUT
): Promise<GameService> {
    const iframeMessagingProvider = (await IframeMessagingProvider.createChild()) as IframeMessagingProvider;
    const service = iframeMessagingProvider.getRemoteService<GameService>(
        'GameService',
        requestTimeout
    );

    document.addEventListener(
        'keydown',
        e => {
            if (e.keyCode === 27) {
                service.emit('esc');
            }
        },
        false
    );

    return service;
}
