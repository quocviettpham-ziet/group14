import { useState } from "react";
import { Card, Form, Input, Button, Row, Col, message, Space, Result } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const success = login(values.username, values.password);

      if (success) {
        message.success("✅ Đăng nhập thành công!");
        form.resetFields();
        // Reload page để update UI
        setTimeout(() => window.location.reload(), 500);
      } else {
        message.error("❌ Tên đăng nhập hoặc mật khẩu không đúng");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" style={{ minHeight: "100vh", paddingTop: "60px" }}>
      <Col xs={24} sm={20} md={12} lg={8}>
        <Card
          title="🔐 Đăng nhập"
          style={{
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            borderRadius: "8px",
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: "20px", padding: "12px", background: "#f0f9ff", borderRadius: "6px", fontSize: "12px", lineHeight: "1.6" }}>
            <p style={{ fontWeight: "600", marginBottom: "8px" }}>📝 Tài khoản test:</p>
            <ul style={{ margin: "0", paddingLeft: "18px" }}>
              <li><strong>Admin:</strong> admin / admin123</li>
              <li><strong>Student:</strong> student1 / student123</li>
              <li><strong>Student:</strong> student2 / student123</li>
            </ul>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

export default Login;
