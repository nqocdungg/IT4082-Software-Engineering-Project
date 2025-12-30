import React, { useState } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import { 
  BookOpen, CreditCard, ShieldCheck, HelpCircle, 
  FileText, ChevronDown, ChevronUp, Monitor 
} from "lucide-react";
import "../../styles/resident/ResidentHelp.css";

export default function ResidentHelp() {
  const [activeTab, setActiveTab] = useState("system");

  const renderContent = () => {
    switch (activeTab) {
      case "system":
        return <SystemGuide />;
      case "payment":
        return <PaymentGuide />;
      case "rules":
        return <NeighborhoodRules />;
      case "fees":
        return <FeeRegulations />;
      case "faq":
        return <FAQSection />;
      default:
        return <SystemGuide />;
    }
  };

  return (
    <div className="page-wrapper">
      <ResidentHeader />
      <div className="help-container">
        {/* SIDEBAR */}
        <div className="help-sidebar">
          <h3>Trung tâm trợ giúp</h3>
          <div className="help-menu">
            <div 
              className={`help-menu-item ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <Monitor size={20} /> Hướng dẫn hệ thống
            </div>
            <div 
              className={`help-menu-item ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              <CreditCard size={20} /> Hướng dẫn thanh toán
            </div>
            <div 
              className={`help-menu-item ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <ShieldCheck size={20} /> Nội quy khu phố
            </div>
            <div 
              className={`help-menu-item ${activeTab === 'fees' ? 'active' : ''}`}
              onClick={() => setActiveTab('fees')}
            >
              <FileText size={20} /> Quy định thu phí
            </div>
            <div 
              className={`help-menu-item ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <HelpCircle size={20} /> Câu hỏi thường gặp
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="help-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

/* --- SUB COMPONENTS --- */

const SystemGuide = () => (
  <div>
    <h2><Monitor color="#2563eb"/> Hướng dẫn sử dụng hệ thống</h2>
    <p className="help-desc">Cách thức đăng nhập, quản lý thông tin cá nhân và xem thông báo.</p>
    
    <div className="guide-step">
      <div className="step-number">1</div>
      <div className="step-content">
        <h4>Đăng nhập tài khoản</h4>
        <p>Sử dụng Tên đăng nhập (Username) do Ban quản lý cung cấp và mật khẩu mặc định. Hãy đổi mật khẩu ngay lần đầu đăng nhập.</p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">2</div>
      <div className="step-content">
        <h4>Kiểm tra thông tin Hộ khẩu</h4>
        <p>Truy cập menu <strong>Hộ khẩu {'>'} Thông tin</strong> để xem danh sách thành viên. Nếu có sai sót, vui lòng liên hệ trực tiếp văn phòng BQL.</p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">3</div>
      <div className="step-content">
        <h4>Xem thông báo</h4>
        <p>Các thông báo quan trọng (lịch cắt điện, nước, sự kiện) sẽ hiển thị ở biểu tượng chuông trên góc phải màn hình.</p>
      </div>
    </div>
  </div>
);

const PaymentGuide = () => (
  <div>
    <h2><CreditCard color="#2563eb"/> Hướng dẫn thanh toán</h2>
    <p className="help-desc">Quy trình thanh toán các khoản phí online nhanh chóng và an toàn.</p>

    <div className="rule-card" style={{borderColor: '#fbbf24', borderLeftColor: '#fbbf24', background: '#fffbeb', marginBottom: 20}}>
      <h4>Lưu ý quan trọng</h4>
      <p>Hệ thống hỗ trợ thanh toán qua mã QR ngân hàng (VietQR). Nội dung chuyển khoản được tạo tự động, vui lòng không tự ý sửa đổi.</p>
    </div>

    <div className="guide-step">
      <div className="step-number">1</div>
      <div className="step-content">
        <h4>Chọn khoản phí</h4>
        <p>Vào mục <strong>Hóa đơn {'>'} Thanh toán hóa đơn</strong>. Hệ thống chia làm 2 loại: Phí Dịch Vụ (Bắt buộc) và Quỹ Đóng Góp (Tự nguyện).</p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">2</div>
      <div className="step-content">
        <h4>Quét mã QR</h4>
        <p>Nhấn nút "Thanh toán ngay". Một mã QR sẽ hiện ra. Sử dụng App Ngân hàng trên điện thoại để quét mã này.</p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">3</div>
      <div className="step-content">
        <h4>Xác nhận</h4>
        <p>Sau khi chuyển khoản thành công, giữ nguyên màn hình web trong khoảng 5-10 giây để hệ thống tự động ghi nhận giao dịch.</p>
      </div>
    </div>
  </div>
);

const NeighborhoodRules = () => (
  <div>
    <h2><ShieldCheck color="#2563eb"/> Nội quy khu phố</h2>
    <p className="help-desc">Các quy định chung để xây dựng khu phố văn minh, an toàn.</p>

    <div className="rules-list">
      <div className="rule-card">
        <h4>1. An ninh trật tự</h4>
        <p>Cư dân ra vào cần mang theo thẻ cư dân. Khách đến thăm cần đăng ký tại chốt bảo vệ. Không gây ồn ào sau 22h00.</p>
      </div>
      <div className="rule-card">
        <h4>2. Vệ sinh môi trường</h4>
        <p>Đổ rác đúng nơi quy định, phân loại rác tái chế và rác hữu cơ. Không vứt rác bừa bãi tại hành lang, cầu thang chung.</p>
      </div>
      <div className="rule-card">
        <h4>3. Phòng cháy chữa cháy</h4>
        <p>Không để vật cản tại lối thoát hiểm. Tuyệt đối không sạc xe điện qua đêm tại khu vực không có người trông coi.</p>
      </div>
      <div className="rule-card">
        <h4>4. Nuôi thú cưng</h4>
        <p>Vật nuôi phải được rọ mõm khi ra nơi công cộng. Chủ nuôi có trách nhiệm dọn vệ sinh cho vật nuôi.</p>
      </div>
    </div>
  </div>
);

const FeeRegulations = () => (
  <div>
    <h2><FileText color="#2563eb"/> Quy định thu phí</h2>
    <p className="help-desc">Giải thích chi tiết về các loại phí đang áp dụng.</p>

    <div className="faq-item">
      <div className="faq-question" style={{cursor: 'default', background: '#e0f2fe', color: '#0369a1'}}>
        I. Khoản thu Bắt buộc (Phí Dịch vụ)
      </div>
      <div className="faq-answer">
        Bao gồm: Phí vệ sinh, Phí an ninh, Phí bảo trì đường bộ, Phí điện chiếu sáng công cộng.<br/>
        <strong>Cách tính:</strong> Theo đầu người (nhân khẩu) hoặc theo diện tích/hộ gia đình tùy loại phí.<br/>
        <strong>Thời hạn:</strong> Cần đóng trước ngày 10 hàng tháng.
      </div>
    </div>

    <div className="faq-item">
      <div className="faq-question" style={{cursor: 'default', background: '#fef3c7', color: '#b45309'}}>
        II. Khoản thu Đóng góp (Tự nguyện)
      </div>
      <div className="faq-answer">
        Bao gồm: Quỹ vì người nghèo, Quỹ khuyến học, Quỹ tổ chức trung thu/tết thiếu nhi.<br/>
        <strong>Cách tính:</strong> Tùy tâm, không giới hạn số tiền tối thiểu.<br/>
        <strong>Mục đích:</strong> Công khai minh bạch để phục vụ các hoạt động cộng đồng.
      </div>
    </div>
  </div>
);

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Tôi quên mật khẩu đăng nhập thì phải làm sao?",
      a: "Bạn vui lòng liên hệ trực tiếp với Cán bộ quản lý hoặc Tổ trưởng dân phố để được cấp lại mật khẩu mới. Vì lý do bảo mật, hệ thống chưa hỗ trợ tự lấy lại mật khẩu qua email."
    },
    {
      q: "Tôi muốn đăng ký tạm trú cho người thân thì làm thế nào?",
      a: "Hiện tại hệ thống chỉ hỗ trợ xem thông tin. Để đăng ký biến động nhân khẩu (tạm trú/tạm vắng), vui lòng mang CCCD ra văn phòng Ban quản lý để làm thủ tục."
    },
    {
      q: "Tại sao tôi đã chuyển khoản nhưng hệ thống vẫn báo 'Chưa đóng'?",
      a: "Hệ thống thường cập nhật tức thời. Tuy nhiên, nếu sau 30 phút vẫn chưa cập nhật, vui lòng chụp ảnh màn hình giao dịch và liên hệ bộ phận Kế toán để đối soát thủ công."
    },
    {
      q: "Tôi có thể xem lại lịch sử đóng tiền của năm ngoái không?",
      a: "Có. Bạn vào mục 'Hóa đơn' -> 'Lịch sử thanh toán'. Hệ thống lưu trữ toàn bộ lịch sử giao dịch kể từ khi bạn bắt đầu sử dụng phần mềm."
    }
  ];

  return (
    <div>
      <h2><HelpCircle color="#2563eb"/> Câu hỏi thường gặp</h2>
      <p className="help-desc">Giải đáp các thắc mắc phổ biến của cư dân.</p>
      
      {faqs.map((item, index) => (
        <div key={index} className="faq-item">
          <div 
            className="faq-question" 
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {item.q}
            {openIndex === index ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          </div>
          {openIndex === index && (
            <div className="faq-answer">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};