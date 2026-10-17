
export function validateCompanyProfile(
    name: string,
    description: string,
    location: string,
    website: string
): string | null {
    if (!name.trim() || !description.trim() || !location.trim()) {
        return 'Please fill in all required fields.';
    }

    if (
        name.length > 150 ||
        description.length > 3000 ||
        location.length > 200
    ) {
        return 'One or more fields exceed the allowed length.';
    }

    if (website) {
        try {
            const url = new URL(website);

            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return 'Please enter a valid website URL.';
            }
        } catch {
            return 'Please enter a valid website URL.';
        }
    }

    return null;
}
