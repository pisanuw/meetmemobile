import { renderHook } from '@testing-library/react-native';
import { useDeepLinkHandler } from '@/hooks/useDeepLinkHandler';

// expo-linking is mocked globally in jest.setup.ts; we override per-test here.
import * as Linking from 'expo-linking';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

const mockAddEventListener = Linking.addEventListener as jest.Mock;
const mockGetInitialURL = Linking.getInitialURL as jest.Mock;

afterEach(() => jest.resetAllMocks());

describe('useDeepLinkHandler', () => {
  it('subscribes to URL events on mount', () => {
    mockGetInitialURL.mockResolvedValue(null);
    renderHook(() => useDeepLinkHandler());
    expect(mockAddEventListener).toHaveBeenCalledWith('url', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const remove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove });
    mockGetInitialURL.mockResolvedValue(null);

    const { unmount } = renderHook(() => useDeepLinkHandler());
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('navigates to webview-auth for a magic-link URL from addEventListener', () => {
    const magicUrl = 'https://meetme.pisan.me/api/auth/magic?token=abc';
    let capturedListener!: (event: { url: string }) => void;
    mockAddEventListener.mockImplementation((_event: string, listener: (e: { url: string }) => void) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });
    mockGetInitialURL.mockResolvedValue(null);

    renderHook(() => useDeepLinkHandler());
    capturedListener({ url: magicUrl });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/webview-auth',
      params: { mode: 'magic', url: magicUrl },
    });
  });

  it('navigates to webview-auth for a verify URL from addEventListener', () => {
    const verifyUrl = 'https://meetme.pisan.me/api/auth/verify?token=xyz';
    let capturedListener!: (event: { url: string }) => void;
    mockAddEventListener.mockImplementation((_event: string, listener: (e: { url: string }) => void) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });
    mockGetInitialURL.mockResolvedValue(null);

    renderHook(() => useDeepLinkHandler());
    capturedListener({ url: verifyUrl });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/webview-auth',
      params: { mode: 'magic', url: verifyUrl },
    });
  });

  it('does not navigate for non-auth URLs from addEventListener', () => {
    let capturedListener!: (event: { url: string }) => void;
    mockAddEventListener.mockImplementation((_event: string, listener: (e: { url: string }) => void) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });
    mockGetInitialURL.mockResolvedValue(null);

    renderHook(() => useDeepLinkHandler());
    capturedListener({ url: 'meetme://meetings/abc' });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles a magic-link URL from getInitialURL (cold-start)', async () => {
    const magicUrl = 'https://meetme.pisan.me/api/auth/magic?token=cold';
    mockAddEventListener.mockReturnValue({ remove: jest.fn() });
    mockGetInitialURL.mockResolvedValue(magicUrl);

    const { result } = renderHook(() => useDeepLinkHandler());
    // Let the getInitialURL promise resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/webview-auth',
      params: { mode: 'magic', url: magicUrl },
    });
  });

  it('does not navigate when getInitialURL returns null', async () => {
    mockAddEventListener.mockReturnValue({ remove: jest.fn() });
    mockGetInitialURL.mockResolvedValue(null);

    renderHook(() => useDeepLinkHandler());
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockPush).not.toHaveBeenCalled();
  });
});
