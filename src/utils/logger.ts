export default function logEvent(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}
