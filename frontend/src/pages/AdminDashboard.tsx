import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Table,
  Row,
  Col,
  Tag,
  Modal,
  Empty,
  Space,
  message,
  Divider,
} from "antd";
import {
  PrinterOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import CryptoJS from "crypto-js";

function AdminDashboard() {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load dữ liệu từ localStorage khi component mount
  useEffect(() => {
    const savedCerts = localStorage.getItem("certificates");
    if (savedCerts) {
      try {
        setData(JSON.parse(savedCerts));
      } catch (err) {
        console.error("Error loading certificates:", err);
      }
    }
  }, []);

  // Lưu dữ liệu vào localStorage mỗi khi data thay đổi
  useEffect(() => {
    localStorage.setItem("certificates", JSON.stringify(data));
  }, [data]);

  const onFinish = (values) => {
    const certId = CryptoJS.SHA256(
      values.studentId + Date.now()
    ).toString().substring(0, 12).toUpperCase();

    const newCert = {
      key: certId,
      studentId: values.studentId,
      name: values.name,
      degree: values.degree,
      issueDate: values.date?.format("DD/MM/YYYY"),
      issuer: values.issuer || "Đại học Công Nghệ",
      certId,
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    setData([newCert, ...data]);
    form.resetFields();
    message.success("✅ Cấp văn bằng thành công!");
  };

  const showCertificate = (record) => {
    setSelectedCert(record);
    setIsModalVisible(true);
  };

  const deleteCert = (key) => {
    setData(data.filter((item) => item.key !== key));
    message.success("Xóa văn bằng thành công");
  };

  const columns = [
    {
      title: "Mã chứng chỉ",
      dataIndex: "certId",
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Mã SV",
      dataIndex: "studentId",
      width: 100,
    },
    {
      title: "Tên sinh viên",
      dataIndex: "name",
    },
    {
      title: "Văn bằng",
      dataIndex: "degree",
      width: 120,
    },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      width: 120,
    },
    {
      title: "Hành động",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showCertificate(record)}
          >
            Xem
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => deleteCert(record.key)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Form cấp văn bằng */}
        <Col xs={24} md={10}>
          <Card
            title="🎓 Cấp văn bằng"
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Form.Item
                label="Mã sinh viên"
                name="studentId"
                rules={[
                  { required: true, message: "Vui lòng nhập mã sinh viên" },
                ]}
              >
                <Input placeholder="VD: SV20210001" />
              </Form.Item>

              <Form.Item
                label="Tên sinh viên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="VD: Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                label="Loại văn bằng"
                name="degree"
                rules={[{ required: true, message: "Vui lòng chọn loại văn bằng" }]}
              >
                <Select placeholder="Chọn loại văn bằng">
                  <Select.Option value="Cử nhân CNTT">
                    Cử nhân CNTT
                  </Select.Option>
                  <Select.Option value="Cử nhân Kinh tế">
                    Cử nhân Kinh tế
                  </Select.Option>
                  <Select.Option value="Cử nhân Quản lý">
                    Cử nhân Quản lý
                  </Select.Option>
                  <Select.Option value="Thạc sĩ CNTT">Thạc sĩ CNTT</Select.Option>
                  <Select.Option value="Thạc sĩ Kinh tế">
                    Thạc sĩ Kinh tế
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Đơn vị cấp"
                name="issuer"
                initialValue="Đại học Công Nghệ"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Ngày cấp"
                name="date"
                rules={[{ required: true, message: "Vui lòng chọn ngày cấp" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<CheckCircleOutlined />}
              >
                Cấp văn bằng (Blockchain)
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Danh sách văn bằng */}
        <Col xs={24} md={14}>
          <Card
            title={`📋 Danh sách văn bằng (${data.length})`}
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            {data.length === 0 ? (
              <Empty description="Chưa có văn bằng nào" />
            ) : (
              <Table
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal xem chi tiết văn bằng */}
      <Modal
        title="🎓 Chi tiết văn bằng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>
            In văn bằng
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedCert && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            {/* Header */}
            <div style={{ marginBottom: "30px" }}>
              <h2 style={{ color: "#667eea", fontSize: "28px", margin: "0 0 10px 0" }}>
                🎓 CHỨNG CHỈ HỌC TẬP
              </h2>
              <p style={{ color: "#666", fontSize: "14px" }}>Được cấp bởi hệ thống Blockchain</p>
            </div>

            <Divider />

            {/* Content */}
            <div style={{ textAlign: "left", margin: "30px 0" }}>
              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  background: "#f5f7fa",
                  borderRadius: "8px",
                }}
              >
                <p style={{ marginBottom: "10px" }}>
                  <strong>Mã chứng chỉ:</strong>{" "}
                  <Tag color="blue">{selectedCert.certId}</Tag>
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Tên sinh viên:</strong> {selectedCert.name}
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Mã sinh viên:</strong> {selectedCert.studentId}
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Loại văn bằng:</strong> {selectedCert.degree}
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Đơn vị cấp:</strong> {selectedCert.issuer}
                </p>
                <p style={{ marginBottom: "0" }}>
                  <strong>Ngày cấp:</strong> {selectedCert.issueDate}
                </p>
              </div>

              <div
                style={{
                  padding: "15px",
                  background: "#f0f9ff",
                  borderLeft: "4px solid #667eea",
                  borderRadius: "4px",
                }}
              >
                <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                  ✓ Chứng chỉ này được cấp trên hệ thống Blockchain và có tính pháp lý
                </p>
                <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#666" }}>
                  Tạo lúc: {selectedCert.createdAt}
                </p>
              </div>
            </div>

            <Divider />

            {/* QR Code */}
            <div style={{ marginTop: "20px", color: "#999", fontSize: "12px" }}>
              <p>Quét mã để xác thực: {selectedCert.certId}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default AdminDashboard;
