import { useState } from "react";
import { ethers } from "ethers";
import { Layout, Menu, Button, Card, Tag, Result, message, ConfigProvider, Modal, Form, Input, Space } from "antd";
import { WalletOutlined, FileDoneOutlined, CheckCircleOutlined, HomeOutlined, LogoutOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import abiJson from "./contracts/CertificateRegistry.json";
import AdminDashboard from "./pages/AdminDashboard";
import StudentLookup from "./pages/StudentLookup";
import Verify from "./pages/Verify";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const { Header, Content, Footer, Sider } = Layout;

function App() {
  const { isLoggedIn, user, logout, login: authLogin } = useAuth();
  const [account, setAccount] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("home");
  const [messageApi, contextHolder] = message.useMessage();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);

  // Xử lý form login
  const handleLoginSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoginLoading(true);
      const success = authLogin(values.username, values.password);

      if (success) {
        message.success("✅ Đăng nhập thành công!");
        setLoginModalVisible(false);
        loginForm.resetFields();
        // Reload để update UI
        setTimeout(() => window.location.reload(), 300);
      } else {
        message.error("❌ Tên đăng nhập hoặc mật khẩu không đúng");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Hiển thị Verify công khai nếu chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#667eea",
            borderRadius: 8,
          },
        }}
      >
        <Layout style={{ minHeight: "100vh" }}>
          {contextHolder}
          {/* Header công khai */}
          <Header
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "0 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ color: "white", margin: 0, fontSize: "24px" }}>
              🎓 Certificate Registry VOV
            </h1>
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => setLoginModalVisible(true)}
              style={{
                background: "rgba(255,255,255,0.3)",
                border: "1px solid white",
                color: "white",
                fontWeight: 600,
              }}
            >
              🔐 Đăng nhập
            </Button>
          </Header>

          {/* Content */}
          <Layout.Content style={{ padding: "32px", background: "#f0f2f5" }}>
            <Verify />
          </Layout.Content>

          {/* Footer */}
          <Layout.Footer
            style={{
              textAlign: "center",
              background: "#f5f5f5",
              borderTop: "1px solid #e8e8e8",
              color: "#666",
              fontWeight: 500,
            }}
          >
            Certificate Registry © 2025 - Powered by Blockchain 🔗
          </Layout.Footer>

          {/* Login Modal */}
          <Modal
            title="🔐 Đăng nhập"
            open={loginModalVisible}
            onCancel={() => {
              setLoginModalVisible(false);
              loginForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={handleLoginSubmit}
            >
              <Form.Item
                label="Tên đăng nhập"
                name="username"
                rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="admin" />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loginLoading}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Layout>
      </ConfigProvider>
    );
  }

  const getContract = async () => {
    if (!(window as any).ethereum) {
      messageApi.error("Chưa cài MetaMask");
      return null;
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      abiJson.abi,
      signer
    );
  };

  const connectMetaMask = async () => {
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      messageApi.success(`✅ Đã kết nối: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (err) {
      console.error(err);
      messageApi.error("❌ Kết nối MetaMask thất bại");
    }
  };

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Trang chủ",
    },
    // Chỉ hiển thị menu "Cấp chứng chỉ" cho admin
    ...(user?.role === "admin"
      ? [
          {
            key: "admin",
            icon: <FileDoneOutlined />,
            label: "Cấp chứng chỉ",
          },
        ]
      : []),
    {
      key: "student",
      icon: <CheckCircleOutlined />,
      label: "Tra cứu",
    },
    {
      key: "verify",
      icon: <CheckCircleOutlined />,
      label: "Xác thực",
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#667eea",
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        {contextHolder}

        {/* Header */}
        <Header
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ color: "white", margin: 0, fontSize: "24px" }}>
            🎓 Certificate Registry VOV
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ color: "white", fontSize: "14px" }}>
              👤 {user?.username} ({user?.role})
            </span>
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{
                background: "rgba(255,255,255,0.3)",
                border: "1px solid white",
                color: "white",
                fontWeight: 600,
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </Header>

        {/* Main Layout */}
        <Layout>
          {/* Sidebar */}
          <Sider
            width={220}
            style={{
              background: "#f5f7fa",
              borderRight: "1px solid #e8e8e8",
            }}
            breakpoint="lg"
            collapsedWidth={0}
          >
            <Menu
              mode="inline"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={(e) => setCurrentPage(e.key)}
              style={{
                borderRight: "none",
                background: "transparent",
                paddingTop: "16px",
              }}
            />
          </Sider>

          {/* Content */}
          <Content style={{ padding: "32px", background: "#f0f2f5" }}>
            {/* Home */}
            {currentPage === "home" && (
              <Card
                title="🏠 Chào mừng"
                style={{
                  maxWidth: "900px",
                  margin: "0 auto",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <h3>Hệ thống quản lý chứng chỉ trên Blockchain</h3>
                  <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
                    Nền tảng xác thực chứng chỉ học tập sử dụng công nghệ blockchain, đảm bảo tính toàn vẹn
                    và không thể giả mạo.
                  </p>
                </div>

                {account ? (
                  <>
                    <Tag color="green" style={{ fontSize: "14px", padding: "8px 12px" }}>
                      ✅ Đã kết nối: {account}
                    </Tag>
                    <p style={{ marginTop: "20px", fontSize: "14px", color: "#999" }}>
                      Chọn một chức năng từ menu bên trái để bắt đầu
                    </p>
                  </>
                ) : (
                  <Result
                    status="info"
                    title="Chưa kết nối"
                    subTitle="Vui lòng kết nối MetaMask ở góc trên phải để sử dụng dApp"
                    style={{ marginTop: "40px" }}
                  />
                )}
              </Card>
            )}

            {/* Admin - Issue Certificate */}
            {currentPage === "admin" && user?.role !== "admin" && (
              <Result
                status="403"
                title="Không có quyền truy cập"
                subTitle={`Chỉ admin mới có thể cấp chứng chỉ. Bạn hiện là: ${user?.role}`}
              />
            )}
            {currentPage === "admin" && user?.role === "admin" && <AdminDashboard />}

            {/* Student - Lookup */}
            {currentPage === "student" && <StudentLookup />}

            {/* Verify */}
            {currentPage === "verify" && <Verify />}
          </Content>
        </Layout>

        {/* Footer */}
        <Footer
          style={{
            textAlign: "center",
            background: "#f5f5f5",
            borderTop: "1px solid #e8e8e8",
            color: "#666",
            fontWeight: 500,
          }}
        >
          Certificate Registry © 2025 - Powered by Blockchain 🔗
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
