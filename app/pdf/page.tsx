"use client";

import { useSearchParams } from "next/navigation";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  PDFViewer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function PDFPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "NO-CODE";

  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/redeem/${code}`;
    QRCode.toDataURL(url).then(setQr);
  }, [code]);

  if (!qr) return <div>Lade PDF...</div>;

  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <MyDocument code={code} qr={qr} />
    </PDFViewer>
  );
}

function MyDocument({ code, qr }: { code: string; qr: string }) {
  return (
    <Document>
      <Page size="A4" style={{ padding: 40 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>
            Dein persönlicher Trainingsplan-Code
          </Text>
          <Text style={{ fontSize: 14 }}>
            Bitte nutze den folgenden Code oder scanne den QR-Code.
          </Text>
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 18 }}>Code: {code}</Text>
        </View>

        <Image src={qr} style={{ width: 150, height: 150 }} />

        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 12 }}>
            URL: {process.env.NEXT_PUBLIC_APP_URL}/redeem/{code}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
