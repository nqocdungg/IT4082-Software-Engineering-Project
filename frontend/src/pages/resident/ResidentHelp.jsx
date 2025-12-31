import React, { useState } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import { 
  BookOpen, CreditCard, ShieldCheck, HelpCircle, 
  FileText, ChevronDown, ChevronUp, Monitor, 
  Phone, AlertTriangle, Wrench
} from "lucide-react";
import "../../styles/resident/ResidentHelp.css";

export default function ResidentHelp() {
  const [activeTab, setActiveTab] = useState("contact");

  const renderContent = () => {
    switch (activeTab) {
      case "contact":
        return <ContactGuide />;
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
        return <ContactGuide />;
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
              className={`help-menu-item ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <Phone size={20} /> Liên hệ & Khẩn cấp
            </div>
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

const ContactGuide = () => (
  <div className="fade-in">
    <h2><Phone color="#dc2626"/> Danh bạ khẩn cấp & Liên hệ</h2>
    <p className="help-desc">Các đầu mối liên hệ quan trọng khi xảy ra sự cố.</p>

    <div className="contact-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
      {/* Khẩn cấp */}
      <div className="rule-card" style={{borderColor: '#dc2626', borderLeftWidth: '4px'}}>
        <h4 style={{color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <AlertTriangle size={18}/> Khẩn cấp
        </h4>
        <ul style={{listStyle: 'none', padding: 0, marginTop: '10px'}}>
          <li style={{marginBottom: '8px'}}><strong>Công an phường:</strong> 024.3868.xxxx</li>
          <li style={{marginBottom: '8px'}}><strong>Cứu hỏa/Cứu thương:</strong> 114 / 115</li>
          <li><strong>Hotline Bảo vệ (24/7):</strong> 0988.xxx.xxx</li>
        </ul>
      </div>

      {/* Ban quản lý */}
      <div className="rule-card" style={{borderColor: '#2563eb', borderLeftWidth: '4px'}}>
        <h4 style={{color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <ShieldCheck size={18}/> Văn phòng BQL
        </h4>
        <ul style={{listStyle: 'none', padding: 0, marginTop: '10px'}}>
          <li style={{marginBottom: '8px'}}><strong>Tổ trưởng TDP:</strong> Bác Nguyễn Văn A - 0912.xxx.xxx</li>
          <li style={{marginBottom: '8px'}}><strong>Kế toán thu phí:</strong> Cô Lê Thị B - 0977.xxx.xxx</li>
          <li><strong>Giờ làm việc:</strong> 8:00 - 17:30 (Thứ 2 - Thứ 6)</li>
        </ul>
      </div>

      {/* Kỹ thuật */}
      <div className="rule-card" style={{borderColor: '#d97706', borderLeftWidth: '4px'}}>
        <h4 style={{color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Wrench size={18}/> Kỹ thuật & Dịch vụ
        </h4>
        <ul style={{listStyle: 'none', padding: 0, marginTop: '10px'}}>
          <li style={{marginBottom: '8px'}}><strong>Sửa chữa điện nước:</strong> 0903.xxx.xxx</li>
          <li style={{marginBottom: '8px'}}><strong>Đơn vị thu gom rác:</strong> 024.xxxx.xxxx</li>
          <li><strong>Hỗ trợ kỹ thuật App:</strong> 0868.xxx.xxx (Admin)</li>
        </ul>
      </div>
    </div>
  </div>
);

const SystemGuide = () => (
  <div className="fade-in">
    <h2><Monitor color="#2563eb"/> Hướng dẫn sử dụng hệ thống</h2>
    <p className="help-desc">Cách thức quản lý tài khoản và thông tin cá nhân.</p>
    
    <div className="guide-step">
      <div className="step-number">1</div>
      <div className="step-content">
        <h4>Đăng nhập & Bảo mật</h4>
        <p>Sử dụng Username do BQL cung cấp. <br/>
        <span style={{color: '#dc2626', fontSize: '13px'}}>* Lưu ý: Vì lý do an toàn, hệ thống không cho phép tự đổi mật khẩu. Nếu nghi ngờ lộ mật khẩu, vui lòng liên hệ trực tiếp Admin để được reset.</span></p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">2</div>
      <div className="step-content">
        <h4>Kiểm tra thông tin Hộ khẩu</h4>
        <p>Truy cập <strong>Hộ khẩu {'>'} Thông tin hộ khẩu</strong>. Tại đây bạn có thể xem chi tiết từng thành viên, số CCCD, ngày sinh. Kiểm tra kỹ trạng thái (Thường trú/Tạm trú) để đảm bảo quyền lợi.</p>
      </div>
    </div>
    <div className="guide-step">
      <div className="step-number">3</div>
      <div className="step-content">
        <h4>Xem thông báo & Tin tức</h4>
        <p>Biểu tượng 🔔 trên góc phải sẽ hiện chấm đỏ khi có tin mới.
        <br/>- <strong>Thông báo chung:</strong> Lịch cắt điện, phun thuốc muỗi...
        <br/>- <strong>Cá nhân & Phí:</strong> Nhắc nợ, xác nhận thanh toán, chúc mừng sinh nhật.</p>
      </div>
    </div>
  </div>
);

const PaymentGuide = () => (
  <div className="fade-in">
    <h2><CreditCard color="#2563eb"/> Hướng dẫn thanh toán</h2>
    <p className="help-desc">Quy trình thanh toán online và xử lý sự cố.</p>

    <div className="rule-card" style={{borderColor: '#fbbf24', borderLeftColor: '#fbbf24', background: '#fffbeb', marginBottom: 20}}>
      <h4>Lưu ý quan trọng</h4>
      <p>Hệ thống sử dụng VietQR tự động. Nội dung chuyển khoản được mã hóa (VD: <code>PAYMENT:MANDATORY:150000</code>). <strong>Vui lòng KHÔNG sửa nội dung chuyển khoản</strong> để tránh sai sót. Ngoài ra cư dân có thể đến trực tiếp nhà văn hóa để đóng các loại phí bắt buộc/ ủng hộ vào giờ hành chính từ thứ 2 - thứ 6</p>
    </div>

    <div className="guide-step">
      <div className="step-number">1</div>
      <div className="step-content">
        <h4>Quy trình thanh toán</h4>
        <p>1. Chọn mục <strong>Hóa đơn {'>'} Thanh toán hóa đơn</strong>.<br/>
        2. Chọn loại phí (Bắt buộc hoặc Đóng góp).<br/>
        3. Nhấn "Thanh toán ngay" để tạo mã QR.<br/>
        4. Quét mã bằng App ngân hàng và xác nhận.</p>
      </div>
    </div>
    
    <div className="guide-step">
      <div className="step-number">2</div>
      <div className="step-content">
        <h4>Xử lý sự cố thanh toán</h4>
        <p>Nếu đã trừ tiền nhưng hệ thống vẫn báo "Chưa đóng":<br/>
        - Chờ khoảng <strong>5-10 phút</strong> để ngân hàng đồng bộ.<br/>
        - Nếu quá lâu, chụp ảnh "Giao dịch thành công" gửi Zalo cho Kế toán (SĐT tại mục Liên hệ) để được duyệt thủ công.</p>
      </div>
    </div>

    <div className="guide-step">
      <div className="step-number">3</div>
      <div className="step-content">
        <h4>Tải hóa đơn điện tử</h4>
        <p>Sau khi thanh toán thành công (trạng thái chuyển sang màu xanh), bạn có thể vào mục <strong>Lịch sử thanh toán</strong> và nhấn biểu tượng PDF để tải biên lai về máy.</p>
      </div>
    </div>
  </div>
);

const NeighborhoodRules = () => (
  <div className="fade-in">
    <h2><ShieldCheck color="#2563eb"/> Nội quy khu phố</h2>
    <p className="help-desc">Quy định chung xây dựng nếp sống văn minh.</p>

    <div className="rules-list">
      <div className="rule-card">
        <h4>1. An ninh & Trật tự</h4>
        <p>- Ra vào sau 23:00 vui lòng báo bảo vệ.<br/>
        - Không gây ồn ào, hát karaoke công suất lớn trong khung giờ nghỉ ngơi (22:00 - 06:00 và 12:00 - 13:30).<br/>
        - Khách đến chơi ở lại qua đêm cần đăng ký tạm trú.</p>
      </div>
      <div className="rule-card">
        <h4>2. Vệ sinh & Môi trường</h4>
        <p>- Đổ rác đúng giờ quy định (18:00 - 20:00 hàng ngày).<br/>
        - Phân loại rác tài chế và rác hữu cơ.<br/>
        - Không thả rông vật nuôi. Chó mèo khi ra ngoài phải rọ mõm và có người dắt.</p>
      </div>
      <div className="rule-card">
        <h4>3. Phương tiện & Đỗ xe</h4>
        <p>- Ô tô đỗ đúng vạch kẻ quy định, không chắn lối đi chung.<br/>
        - Xe máy để gọn gàng, quay đầu ra ngoài.<br/>
        - Tuyệt đối không sạc xe điện qua đêm tại khu vực chung không có giám sát.</p>
      </div>
      <div className="rule-card">
        <h4>4. Sửa chữa & Thi công</h4>
        <p>- Các hộ gia đình sửa chữa nhà cửa cần đăng ký với BQL trước 03 ngày.<br/>
        - Chỉ được phép thi công khoan đục từ 8:00 - 11:30 và 13:30 - 17:00 (trừ CN và ngày lễ).</p>
      </div>
    </div>
  </div>
);

const FeeRegulations = () => (
  <div className="fade-in">
    <h2><FileText color="#2563eb"/> Quy định thu phí</h2>
    <p className="help-desc">Minh bạch hóa các khoản thu chi.</p>

    <div className="faq-item">
      <div className="faq-question" style={{cursor: 'default', background: '#e0f2fe', color: '#0369a1'}}>
        I. Khoản thu Bắt buộc (Phí Dịch vụ)
      </div>
      <div className="faq-answer">
        Là các khoản phí duy trì vận hành khu phố, bắt buộc với mọi hộ dân đang sinh sống.<br/>
        <ul>
            <li><strong>Phí vệ sinh:</strong> 6.000đ / người / tháng.</li>
            <li><strong>Phí an ninh:</strong> 50.000đ / hộ / tháng.</li>
            <li><strong>Phí đóng góp CSVC:</strong> Theo diện tích nhà.</li>
        </ul>
        <em>* Thời hạn đóng: Từ ngày 1 đến ngày 10 hàng tháng.</em>
      </div>
    </div>

    <div className="faq-item">
      <div className="faq-question" style={{cursor: 'default', background: '#fef3c7', color: '#b45309'}}>
        II. Khoản thu Đóng góp (Tự nguyện)
      </div>
      <div className="faq-answer">
        Các quỹ xã hội, từ thiện. Không bắt buộc, tùy tâm và tùy điều kiện kinh tế.<br/>
        <ul>
            <li>Quỹ vì người nghèo.</li>
            <li>Quỹ đền ơn đáp nghĩa.</li>
            <li>Quỹ khuyến học & Tổ chức Tết thiếu nhi/Trung thu.</li>
        </ul>
        <em>* Mọi khoản đóng góp đều được công khai danh sách ủng hộ.</em>
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
      q: "Thông tin nhân khẩu của nhà tôi bị sai (thiếu người, sai ngày sinh)?",
      a: "Vui lòng mang Sổ hộ khẩu hoặc Giấy khai sinh/CCCD của thành viên đó đến văn phòng BQL. Chúng tôi sẽ đối chiếu và cập nhật ngay lập tức trên hệ thống."
    },
    {
      q: "Tôi muốn đăng ký tạm trú cho người thân thì làm thế nào?",
      a: "Hiện tại App chỉ hỗ trợ xem thông tin. Thủ tục hành chính (tạm trú/tạm vắng) cần ra Công an phường hoặc thông qua BQL để được hướng dẫn hồ sơ giấy."
    },
    {
      q: "Tại sao tôi đã chuyển khoản nhưng hệ thống vẫn báo 'Chưa đóng'?",
      a: "Hệ thống thường cập nhật tức thời. Tuy nhiên, nếu sau 30 phút vẫn chưa cập nhật, vui lòng chụp ảnh màn hình giao dịch và liên hệ bộ phận Kế toán (0977.xxx.xxx) để đối soát thủ công."
    },
    {
      q: "Tôi có thể xem lại lịch sử đóng tiền của năm ngoái không?",
      a: "Có. Bạn vào mục 'Hóa đơn' -> 'Lịch sử thanh toán'. Hệ thống lưu trữ toàn bộ lịch sử giao dịch kể từ khi bạn bắt đầu sử dụng phần mềm."
    },
    {
      q: "Nhà tôi đi vắng cả tháng, có được miễn phí rác/phí dịch vụ không?",
      a: "Theo quy định, nếu hộ gia đình có đơn xin tạm vắng trên 30 ngày gửi BQL, bạn sẽ được xem xét miễn giảm một số loại phí dịch vụ tính theo đầu người."
    }
  ];

  return (
    <div className="fade-in">
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