
import { SatuSehatClient } from '../client';

// Mock fetch
global.fetch = jest.fn();

describe('SatuSehatClient', () => {
    let client: SatuSehatClient;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new SatuSehatClient();
        // Mock token endpoint to avoid real auth calls
        (global.fetch as jest.Mock).mockImplementation((url) => {
            if (url.includes('/oauth2/v1/accesstoken')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
            });
        });
    });

    describe('makeRequest Error Handling', () => {
        it('should handle generic text errors', async () => {
            (global.fetch as jest.Mock).mockImplementationOnce((url) => {
                if (url.includes('/oauth2/v1/accesstoken')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
                    });
                }
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Something went wrong',
                });
            });

            await expect(client.getPatient('123')).rejects.toThrow(
                'SatuSehat API error: 500 Internal Server Error - Something went wrong'
            );
        });

        it('should handle standard JSON errors', async () => {
            (global.fetch as jest.Mock).mockImplementationOnce((url) => {
                if (url.includes('/oauth2/v1/accesstoken')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
                    });
                }
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    statusText: 'Bad Request',
                    text: async () => JSON.stringify({ message: 'Invalid ID format' }),
                });
            });

            await expect(client.getPatient('123')).rejects.toThrow(
                'SatuSehat Error: Invalid ID format (400)'
            );
        });

        it('should handle FHIR OperationOutcome errors', async () => {
            const operationOutcome = {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'value',
                        diagnostics: 'NIK must be 16 digits',
                    },
                ],
            };

            (global.fetch as jest.Mock).mockImplementationOnce((url) => {
                if (url.includes('/oauth2/v1/accesstoken')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
                    });
                }
                return Promise.resolve({
                    ok: false,
                    status: 422,
                    statusText: 'Unprocessable Entity',
                    text: async () => JSON.stringify(operationOutcome),
                });
            });

            await expect(client.getPatient('123')).rejects.toThrow(
                'SatuSehat Error: NIK must be 16 digits (422)'
            );
        });

        it('should fallback to raw body if JSON parsing fails', async () => {
            (global.fetch as jest.Mock).mockImplementationOnce((url) => {
                if (url.includes('/oauth2/v1/accesstoken')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
                    });
                }
                return Promise.resolve({
                    ok: false,
                    status: 502,
                    statusText: 'Bad Gateway',
                    text: async () => '<html>Bad Gateway</html>',
                });
            });

            await expect(client.getPatient('123')).rejects.toThrow(
                'SatuSehat API error: 502 Bad Gateway - <html>Bad Gateway</html>'
            );
        });
    });
});
