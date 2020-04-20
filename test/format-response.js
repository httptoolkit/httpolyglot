/**
 * @param {{ url: any; status: any; headers: any; text: () => any; }} r
 */
export function formatresponse(r) {
    return Promise.all([r.url, r.status, [...r.headers], r.text()]);
}
