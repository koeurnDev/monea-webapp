"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, Search, Wrench, Image as ImageIcon } from "lucide-react";
import { moneaClient } from "@/lib/api-client";

interface ImageReference {
    type: string;
    url: string;
    index?: number;
    exists?: boolean | null;
    checked?: boolean;
}

interface WeddingImageReport {
    weddingId: string;
    groomName: string;
    brideName: string;
    totalImages: number;
    brokenImages: ImageReference[];
    status: 'ok' | 'has-broken-images';
    removedImages?: number;
    fixed?: boolean;
}

interface ScanResult {
    success: boolean;
    summary: {
        totalWeddings: number;
        weddingsWithIssues: number;
        totalImagesScanned: number;
        totalBrokenImages: number;
    };
    reports: WeddingImageReport[];
    checkUrls: boolean;
    note: string;
}

export default function MediaValidatorPage() {
    const [scanning, setScanning] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [weddingId, setWeddingId] = useState("");
    const [checkUrls, setCheckUrls] = useState(false);

    const handleScan = async () => {
        setScanning(true);
        setError(null);
        setScanResult(null);

        try {
            const params = new URLSearchParams();
            if (weddingId) params.append('weddingId', weddingId);
            if (checkUrls) params.append('checkUrls', 'true');

            const response = await moneaClient.get<ScanResult>(`/admin/media-validator/scan?${params.toString()}`);
            if (response.error || !response.data) {
                throw new Error(response.error || 'Failed to scan images');
            }
            setScanResult(response.data);
        } catch (err: any) {
            setError(err.message || 'An error occurred while scanning');
            console.error('[Media Validator] Scan error:', err);
        } finally {
            setScanning(false);
        }
    };

    const handleFixWedding = async (wedding: WeddingImageReport) => {
        if (!wedding.brokenImages.length) return;

        setFixing(true);
        setError(null);

        try {
            const response = await moneaClient.post<{ removedImages?: number }>('/admin/media-validator/fix', {
                weddingId: wedding.weddingId,
                brokenImages: wedding.brokenImages,
                dryRun: false,
            });
            if (response.error || !response.data) {
                throw new Error(response.error || 'Failed to fix images');
            }
            
            // Update the scan result to reflect the fix
            if (scanResult) {
                setScanResult({
                    ...scanResult,
                    reports: scanResult.reports.map(r => 
                        r.weddingId === wedding.weddingId 
                            ? { ...r, status: 'ok', brokenImages: [], fixed: true }
                            : r
                    ),
                    summary: {
                        ...scanResult.summary,
                        weddingsWithIssues: scanResult.summary.weddingsWithIssues - 1,
                        totalBrokenImages: scanResult.summary.totalBrokenImages - wedding.brokenImages.length,
                    }
                });
            }

            alert(`Successfully removed ${response.data.removedImages ?? 0} broken image references`);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fixing images');
            console.error('[Media Validator] Fix error:', err);
        } finally {
            setFixing(false);
        }
    };

    const handleFixAll = async () => {
        if (!scanResult || !window.confirm(
            `This will fix ${scanResult.summary.weddingsWithIssues} weddings and remove ${scanResult.summary.totalBrokenImages} broken image references. Continue?`
        )) {
            return;
        }

        setFixing(true);
        setError(null);

        try {
            const response = await moneaClient.post<{ message?: string }>('/admin/media-validator/fix-all', {
                dryRun: false,
                checkUrls: checkUrls,
            });
            if (response.error || !response.data) {
                throw new Error(response.error || 'Failed to fix all images');
            }

            alert(response.data.message || 'Image validation completed.');
            
            // Re-scan after fixing
            await handleScan();
        } catch (err: any) {
            setError(err.message || 'An error occurred while fixing all images');
            console.error('[Media Validator] Fix all error:', err);
        } finally {
            setFixing(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Media Validator</h1>
                <p className="text-muted-foreground">
                    Scan and fix broken image references across all weddings
                </p>
            </div>

            {/* Scan Controls */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Scan Settings</CardTitle>
                    <CardDescription>
                        Configure and run image validation scan
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="weddingId" className="text-sm font-medium">
                                Wedding ID (optional)
                            </label>
                            <input
                                id="weddingId"
                                type="text"
                                placeholder="Leave empty to scan all weddings"
                                value={weddingId}
                                onChange={(e) => setWeddingId(e.target.value)}
                                className="px-3 py-2 border rounded-md"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="checkUrls"
                                type="checkbox"
                                checked={checkUrls}
                                onChange={(e) => setCheckUrls(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <label htmlFor="checkUrls" className="text-sm">
                                Validate URLs (slower but checks for 404s)
                            </label>
                        </div>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                {checkUrls 
                                    ? "Full validation will check each image URL for 404 errors. This is slower but more accurate."
                                    : "Quick scan mode only checks for null/empty references. Use full validation to detect 404 errors."
                                }
                            </AlertDescription>
                        </Alert>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            onClick={handleScan} 
                            disabled={scanning || fixing}
                            className="flex items-center gap-2"
                        >
                            {scanning ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Scan Images
                                </>
                            )}
                        </Button>

                        {scanResult && scanResult.summary.weddingsWithIssues > 0 && (
                            <Button 
                                onClick={handleFixAll}
                                disabled={scanning || fixing}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                {fixing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Fixing...
                                    </>
                                ) : (
                                    <>
                                        <Wrench className="h-4 w-4" />
                                        Fix All ({scanResult.summary.weddingsWithIssues})
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Scan Results Summary */}
            {scanResult && (
                <>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Scan Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Weddings</span>
                                    <span className="text-2xl font-bold">{scanResult.summary.totalWeddings}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">With Issues</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {scanResult.summary.weddingsWithIssues}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Total Images</span>
                                    <span className="text-2xl font-bold">{scanResult.summary.totalImagesScanned}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Broken Images</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {scanResult.summary.totalBrokenImages}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">{scanResult.note}</p>
                        </CardContent>
                    </Card>

                    {/* Wedding Reports */}
                    {scanResult.reports.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Weddings with Issues</h2>
                            {scanResult.reports.map((wedding) => (
                                <Card key={wedding.weddingId}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {wedding.groomName} & {wedding.brideName}
                                                    {wedding.status === 'ok' ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            OK
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            {wedding.brokenImages.length} Issues
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription>ID: {wedding.weddingId}</CardDescription>
                                            </div>
                                            {wedding.status !== 'ok' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleFixWedding(wedding)}
                                                    disabled={fixing}
                                                >
                                                    {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fix'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-muted-foreground">
                                                    Total Images: {wedding.totalImages}
                                                </span>
                                                {wedding.brokenImages.length > 0 && (
                                                    <span className="text-red-600 font-medium">
                                                        Broken: {wedding.brokenImages.length}
                                                    </span>
                                                )}
                                            </div>

                                            {wedding.brokenImages.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium mb-2">Broken Images:</h4>
                                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                                        {wedding.brokenImages.map((img, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="text-xs bg-muted p-2 rounded flex items-start gap-2"
                                                            >
                                                                <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium">{img.type}</div>
                                                                    <div className="text-muted-foreground truncate">
                                                                        {img.url}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                                <p className="text-muted-foreground">
                                    No weddings with broken image references found.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
