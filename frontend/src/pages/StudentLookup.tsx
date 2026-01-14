import { useState } from "react";
import {
  Card,
  Input,
  Button,
  Descriptions,
} from "antd";
import QRCode from "qrcode.react";

function StudentLookup() {
  const [show, setShow] = useState(false);

  return (
    <Card
      title="👤 Tra cứu văn bằng cá nhân"
      style={{
        maxWidth: 600,
        margin: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Input placeholder="Nhập mã sinh viên" />

      <Button
        type="primary"
        style={{ marginTop: 15 }}
        onClick={() => setShow(true)}
      >
        Tra cứu
      </Button>

      {show && (
        <>
          <Descriptions
            bordered
            column={1}
            style={{ marginTop: 20 }}
          >
            <Descriptions.Item label="Tên">
              Nguyễn Văn A
            </Descriptions.Item>
            <Descriptions.Item label="Văn bằng">
              Cử nhân CNTT
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              Hợp lệ
            </Descriptions.Item>
          </Descriptions>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
            }}
          >
            <QRCode value="https://verify.com/0x123" />
          </div>
        </>
      )}
    </Card>
  );
}

export default StudentLookup;
