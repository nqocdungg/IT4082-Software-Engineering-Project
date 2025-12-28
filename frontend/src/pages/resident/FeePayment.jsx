import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ResidentHeader from "../../components/resident/ResidentHeader";
import "../../styles/resident/ResidentFees.css";

const formatCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v ?? 0);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

export default function FeePayment() {
  const [mandatoryFees, setMandatoryFees] = useState([]);
  const [contributionFees, setContributionFees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/household/fees/pending",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMandatoryFees(res.data?.mandatoryFees || []);
        setContributionFees(res.data?.contributionFees || []);
      } catch (err) {
        console.error("Fetch fee error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  const totalMandatory = useMemo(
    () => mandatoryFees.reduce((s, f) => s + (f.amount || 0), 0),
    [mandatoryFees]
  );

  return (
    <div className="fee-page">
      <ResidentHeader />

      <div className="fee-container">
        <div className="fee-wrapper">
          <h1 className="page-title">Thanh toán hóa đơn</h1>

          <div className="fee-grid">
            <section className="fee-box">
              <div className="fee-box-header">
                <div>
                  <div className="box-title">Phí dịch vụ</div>
                  <div className="box-subtitle">
                    Các khoản phí bắt buộc theo quy định
                  </div>
                </div>
                <span className="badge required">Bắt buộc</span>
              </div>

              <div className="fee-table">
                <div className="fee-table-head">
                  <span>Khoản phí</span>
                  <span>Thời gian</span>
                  <span className="right">Số tiền</span>
                </div>

                {loading ? (
                  <div className="fee-empty">Đang tải dữ liệu…</div>
                ) : mandatoryFees.length === 0 ? (
                  <div className="fee-empty">Không có khoản phí bắt buộc</div>
                ) : (
                  mandatoryFees.map((f) => (
                    <div className="fee-table-row" key={f.id}>
                      <div>
                        <div className="fee-name">{f.feeType?.name}</div>
                        <div className="fee-desc">{f.feeType?.description}</div>
                      </div>
                      <span>{formatDate(f.feeType?.fromDate)}</span>
                      <span className="money red">
                        {formatCurrency(f.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="fee-box">
              <div className="fee-box-header">
                <div>
                  <div className="box-title">Đóng góp</div>
                  <div className="box-subtitle">
                    Các khoản đóng góp tự nguyện
                  </div>
                </div>
                <span className="badge optional">Tự nguyện</span>
              </div>

              <div className="fee-table">
                <div className="fee-table-head">
                  <span>Khoản đóng góp</span>
                  <span>Thời gian</span>
                  <span className="right">Đã ủng hộ</span>
                </div>

                {loading ? (
                  <div className="fee-empty">Đang tải dữ liệu…</div>
                ) : contributionFees.length === 0 ? (
                  <div className="fee-empty">Chưa có khoản đóng góp</div>
                ) : (
                  contributionFees.map((f) => (
                    <div className="fee-table-row" key={f.id}>
                      <div>
                        <div className="fee-name">{f.name}</div>
                        <div className="fee-desc">{f.description}</div>
                      </div>
                      <span>{formatDate(f.fromDate)}</span>
                      <span className="money green">
                        {formatCurrency(f.totalCommunityDonated)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="fee-summary">
            <span>Tổng phí bắt buộc cần thanh toán</span>
            <span className="total-money">
              {formatCurrency(totalMandatory)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
