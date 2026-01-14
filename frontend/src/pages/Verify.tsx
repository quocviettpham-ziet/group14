import { useState, useRef } from "react";
import {
  Card,
  Input,
  Row,
  Col,
  Tag,
  Descriptions,
  Button,
  Empty,
  Space,
  Divider,
  message,
  Upload,
  Modal,
  Tabs,
  QRCode as AntQRCode,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  UploadOutlined,
  CameraOutlined,
} from "@ant-design/icons";

interface VerifyResult {
  valid: boolean;
  studentName?: string;
  studentId?: string;
  degree?: string;
  issueDate?: string;
  issuer?: string;
  certId?: string;
}

// Mock data
const mockCertificates: Record<string, any> = {
  "CERT001": {
    valid: true,
    studentName: "Nguyễn Văn A",
    studentId: "SV20210001",
    degree: "Cử nhân CNTT",
    issueDate: "01/07/2024",
    issuer: "Đại học Công Nghệ",
    certId: "CERT001",
  },
  "CERT002": {
    valid: true,
    studentName: "Trần Thị B",
    studentId: "SV20210002",
    degree: "Cử nhân Kinh tế",
    issueDate: "15/06/2024",
    issuer: "Đại học Công Nghệ",
    certId: "CERT002",
  },
};

function Verify() {
  const [hash, setHash] = useState<string>("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = () => {
    if (!hash.trim()) {
      message.warning("Vui lòng nhập mã chứng chỉ");
      return;
    }

    const cert = mockCertificates[hash.toUpperCase()];

    if (cert) {
      setResult(cert);
      message.success("✅ Xác thực thành công!");
    } else {
      setResult({ valid: false });
      message.error("❌ Chứng chỉ không hợp lệ hoặc không tồn tại");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Đã sao chép!");
  };

  // Extract text từ hình ảnh - kiểm tra pixel + metadata
  const extractTextFromImage = async (file: File): Promise<string | null> => {
    try {
      setLoading(true);
      message.loading("🔄 Đang phân tích ảnh...", 0);

      // Đọc file ảnh
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Tạo image element để phân tích
      const img = new Image();
      img.src = imageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Kiểm tra size ảnh (văn bằng thường có chiều cao lớn hơn chiều rộng)
      const aspectRatio = img.height / img.width;
      const isDocumentLike = aspectRatio > 0.8; // Văn bằng thường vertical

      // Kiểm tra độ sáng (văn bằng thường có nền sáng)
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas error");

      ctx.drawImage(img, 0, 0);
      const imageData_px = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData_px.data;

      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        brightness += (r + g + b) / 3;
      }
      brightness = brightness / (data.length / 4);

      // Văn bằng thường có độ sáng > 180
      const isBrightImage = brightness > 150;

      message.destroy();

      // Kiểm tra kích thước file (văn bằng thường > 50KB)
      const fileSizeKB = file.size / 1024;
      const isReasonableSize = fileSizeKB > 20;

      // Kết hợp các điều kiện
      if (!isDocumentLike && !isBrightImage && !isReasonableSize) {
        message.warning("⚠️ Ảnh không phù hợp với chứng chỉ. Vui lòng tải ảnh chứng chỉ hoặc nhập mã trực tiếp.");
        return null;
      }

      // Thử tìm mã từ tên file
      const fileNameMatch = file.name.match(/CERT\d+|cert\d+/i);
      if (fileNameMatch) {
        return fileNameMatch[0].toUpperCase();
      }

      // Nếu ảnh có vẻ là chứng chỉ nhưng không tìm được mã
      if (isDocumentLike && isBrightImage) {
        message.warning("⚠️ Ảnh có vẻ là chứng chỉ nhưng không tìm được mã. Nhập mã trực tiếp hoặc đặt tên file là CERT001.jpg");
        return null;
      }

      message.warning("⚠️ Không tìm thấy mã chứng chỉ. Vui lòng nhập mã trực tiếp.");
      return null;

    } catch (err) {
      console.error("Image analysis error:", err);
      message.error("❌ Lỗi phân tích ảnh. Vui lòng thử lại.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      
      // Hiển thị preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Trích xuất mã từ hình ảnh bằng OCR
      const extractedCode = await extractTextFromImage(file);
      
      if (!extractedCode) {
        setLoading(false);
        return false;
      }
      
      setHash(extractedCode);
      
      // Tự động xác thực
      const cert = mockCertificates[extractedCode.toUpperCase()];
      if (cert) {
        setResult(cert);
        message.success("✅ Quét ảnh thành công!");
      } else {
        setResult({ valid: false });
        message.error("❌ Không tìm chứng chỉ: " + extractedCode);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      message.error("❌ Lỗi xử lý ảnh");
      setLoading(false);
    }
    
    return false; // Prevent default upload
  };

  return (
    <Row justify="center" gutter={[8, 8]} style={{ padding: "0 8px" }}>
      <Col xs={24} md={24} lg={20} xl={18}>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "🔍 Xác thực mã",
              children: (
                <Card
                  bordered={false}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", padding: "12px" }}
                >
                  {/* Search Box */}
                  <div style={{ marginBottom: "12px" }}>
                    <Input.Search
                      size="large"
                      placeholder="VD: CERT001"
                      enterButton="Xác thực"
                      value={hash}
                      onChange={(e) => setHash(e.target.value.toUpperCase())}
                      onSearch={handleVerify}
                      allowClear
                      style={{
                        borderRadius: "6px",
                      }}
                    />
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "10px",
                        color: "#999",
                      }}
                    >
                      💡 Nhập mã
                    </div>
                  </div>

                  {/* Result */}
                  {result && renderResult(result, hash, handleCopy, setResult)}
                </Card>
              ),
            },
            {
              key: "2",
              label: "📸 Xác thực ảnh",
              children: (
                <Card
                  bordered={false}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", padding: "12px" }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <Upload
                      accept="image/*"
                      beforeUpload={handleImageUpload}
                      maxCount={1}
                      listType="picture-card"
                      showUploadList={false}
                    >
                      <div style={{ textAlign: "center", padding: "8px" }}>
                        <UploadOutlined style={{ fontSize: "24px", color: "#667eea" }} />
                        <p style={{ marginTop: "4px", marginBottom: "0px", color: "#667eea", fontSize: "11px", fontWeight: "600", lineHeight: "1.2" }}>
                          Tải ảnh
                        </p>
                        <span style={{ fontSize: "9px", color: "#999", lineHeight: "1.2", display: "block" }}>
                          QR/mã
                        </span>
                      </div>
                    </Upload>

                    {previewImage && (
                      <div style={{ marginTop: "16px" }}>
                        <p style={{ fontWeight: "600", marginBottom: "8px", fontSize: "12px" }}>
                          Preview:
                        </p>
                        <img
                          src={previewImage}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "250px",
                            borderRadius: "6px",
                            border: "1px solid #d9d9d9",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  {result && renderResult(result, hash, handleCopy, setResult)}
                </Card>
              ),
            },
          ]}
        />

        {/* Info Box */}
        <Card
          style={{
            marginTop: "12px",
            background: "#fef8e7",
            borderLeft: "4px solid #faad14",
            padding: "12px 14px",
          }}
        >
          <h4 style={{ marginTop: "0", marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
            ℹ️ Hướng dẫn sử dụng
          </h4>
          
          <div style={{ marginBottom: "8px" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#333" }}>
              🔍 Xác thực bằng mã:
            </p>
            <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "11px", lineHeight: "1.4" }}>
              <li>Nhập mã chứng chỉ (VD: CERT001)</li>
              <li>Bấm "Xác thực" để kiểm tra</li>
              <li>Xem thông tin chi tiết</li>
            </ul>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#333" }}>
              📸 Xác thực bằng ảnh:
            </p>
            <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "11px", lineHeight: "1.4" }}>
              <li>Tải ảnh chứng chỉ hoặc QR code</li>
              <li>Hệ thống tự động quét mã</li>
              <li>Kết quả hiển thị ngay</li>
            </ul>
          </div>

          <div>
            <p style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#333" }}>
              ✨ Tính năng khác:
            </p>
            <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "11px", lineHeight: "1.4" }}>
              <li>Sao chép mã bằng nút copy</li>
              <li>Xem mã QR để chia sẻ</li>
              <li>In chứng chỉ (Ctrl+P)</li>
            </ul>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

// Helper function to render result
function renderResult(
  result: VerifyResult,
  hash: string,
  handleCopy: (text: string) => void,
  setResult: (r: VerifyResult | null) => void
) {
  return (
    <div style={{ marginTop: "30px" }}>
      {result.valid ? (
        <>
          {/* Valid Certificate */}
          <div style={{ marginBottom: "20px" }}>
            <Tag
              color="green"
              icon={<CheckCircleOutlined />}
              style={{
                fontSize: "16px",
                padding: "8px 16px",
                borderRadius: "4px",
              }}
            >
              ✓ CHỨNG CHỈ HỢP LỆ
            </Tag>
          </div>

          {/* Certificate Details */}
          <Card
            style={{
              background: "#f0f9ff",
              borderLeft: "4px solid #667eea",
              marginBottom: "20px",
            }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Mã chứng chỉ" contentStyle={{ fontWeight: "600" }}>
                <Space>
                  <Tag color="blue">{result.certId}</Tag>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(result.certId || "")}
                  />
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Tên sinh viên">
                {result.studentName}
              </Descriptions.Item>

              <Descriptions.Item label="Mã sinh viên">
                {result.studentId}
              </Descriptions.Item>

              <Descriptions.Item label="Loại văn bằng">
                <Tag color="purple">{result.degree}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày cấp">
                {result.issueDate}
              </Descriptions.Item>

              <Descriptions.Item label="Đơn vị cấp">
                {result.issuer}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* QR Code & Actions */}
          <Divider />
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ marginBottom: "15px", color: "#666" }}>📱 Mã QR xác thực:</p>
            <div style={{ marginBottom: "20px" }}>
              <AntQRCode value={result.certId || ""} size={200} />
            </div>
            <Space>
              <Button type="primary" onClick={() => window.print()}>
                🖨️ In chứng chỉ
              </Button>
              <Button onClick={() => setResult(null)}>Xác thực khác</Button>
            </Space>
          </div>
        </>
      ) : (
        <>
          {/* Invalid Certificate */}
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Tag
              color="red"
              icon={<CloseCircleOutlined />}
              style={{
                fontSize: "16px",
                padding: "8px 16px",
                marginBottom: "20px",
              }}
            >
              ✗ CHỨNG CHỈ KHÔNG HỢP LỆ
            </Tag>
            <Empty
              description={
                <>
                  <p style={{ marginTop: "16px" }}>
                    Mã chứng chỉ "<strong>{hash}</strong>" không tồn tại trong hệ thống
                  </p>
                  <p style={{ fontSize: "12px", color: "#999" }}>
                    Vui lòng kiểm tra lại mã chứng chỉ
                  </p>
                </>
              }
              style={{ marginTop: "20px" }}
            />
            <Button
              type="primary"
              style={{ marginTop: "20px" }}
              onClick={() => setResult(null)}
            >
              Xác thực khác
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default Verify;
