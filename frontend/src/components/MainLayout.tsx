import { Layout, Menu } from "antd";
import {
  SafetyCertificateOutlined,
  DashboardOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Header, Content, Footer } = Layout;

interface Props {
  children: React.ReactNode;
}

function MainLayout({ children }: Props) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            marginRight: 40,
          }}
        >
          🎓 Certificate Verification
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectable={false}
          items={[
            {
              key: "verify",
              icon: <SafetyCertificateOutlined />,
              label: <Link to="/">Verify</Link>,
            },
            {
              key: "admin",
              icon: <DashboardOutlined />,
              label: <Link to="/admin">Admin</Link>,
            },
            {
              key: "student",
              icon: <UserOutlined />,
              label: <Link to="/student">Student</Link>,
            },
          ]}
        />
      </Header>

      <Content style={{ padding: "40px 80px" }}>
        {children}
      </Content>

      <Footer style={{ textAlign: "center" }}>
        Blockchain Certificate Verification © 2025
      </Footer>
    </Layout>
  );
}

export default MainLayout;
