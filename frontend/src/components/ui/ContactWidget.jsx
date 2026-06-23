import React, { useState, useEffect } from "react";
import { Mail, X, Send, CheckCircle, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../../config";
import { useLanguage } from "../../lib/i18n";

const SUBJECTS = [
  { value: "consulting", label: { en: "Consulting", vi: "Tư vấn" } },
  { value: "complaint",  label: { en: "Complaint", vi: "Khiếu nại" } },
  { value: "feedback",   label: { en: "Feedback", vi: "Góp ý" } },
  { value: "other",      label: { en: "Other", vi: "Khác" } },
];

const INIT = { name: "", email: "", phone: "", subject: "", message: "" };
const INIT_ERRORS = { name: "", email: "", subject: "", message: "" };
const TEXT = {
  en: {
    title: "Contact us",
    sent: "Message sent!",
    sentBody: "Thank you! Your message has been sent successfully.",
    response: "Our team will respond within 24 hours.",
    sendAnother: "Send another message",
    fullName: "Full name",
    namePlaceholder: "Alex Nguyen",
    email: "Email",
    phone: "Phone number",
    optional: "Optional",
    reason: "Contact reason",
    selectReason: "-- Select a reason --",
    message: "Message",
    messagePlaceholder: "Describe your question or issue...",
    sending: "Sending...",
    send: "Send message",
    contact: "Contact",
    aria: "Open contact form",
    errors: {
      name: "Full name is required.",
      email: "Email is required.",
      invalidEmail: "Please enter a valid email address.",
      subject: "Please choose a contact reason.",
      message: "Message is required.",
      submit: "Something went wrong while sending your message. Please try again later or contact us directly through the hotline.",
    },
  },
  vi: {
    title: "Liên hệ với chúng tôi",
    sent: "Gửi thành công!",
    sentBody: "Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công.",
    response: "Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ.",
    sendAnother: "Gửi tin nhắn khác",
    fullName: "Họ và tên",
    namePlaceholder: "Nguyễn Văn A",
    email: "Email",
    phone: "Số điện thoại",
    optional: "Tuỳ chọn",
    reason: "Mục đích liên hệ",
    selectReason: "-- Chọn mục đích --",
    message: "Nội dung tin nhắn",
    messagePlaceholder: "Mô tả câu hỏi hoặc vấn đề của bạn...",
    sending: "Đang gửi...",
    send: "Gửi liên hệ",
    contact: "Liên hệ",
    aria: "Mở form liên hệ",
    errors: {
      name: "Họ và tên là bắt buộc.",
      email: "Email là bắt buộc.",
      invalidEmail: "Vui lòng nhập email hợp lệ.",
      subject: "Vui lòng chọn mục đích liên hệ.",
      message: "Nội dung tin nhắn là bắt buộc.",
      submit: "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua hotline.",
    },
  },
};

export default function ContactWidget() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(INIT);
  const [errors, setErrors]   = useState(INIT_ERRORS);
  const [status, setStatus]   = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handler = () => { setOpen(true); setStatus("idle"); setErrorMsg(""); };
    window.addEventListener("open-contact-widget", handler);
    return () => window.removeEventListener("open-contact-widget", handler);
  }, []);

  function validate() {
    const e = { ...INIT_ERRORS };
    let ok = true;
    if (!form.name.trim())    { e.name    = text.errors.name; ok = false; }
    if (!form.email.trim())   { e.email   = text.errors.email; ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                               e.email   = text.errors.invalidEmail; ok = false; }
    if (!form.subject)        { e.subject = text.errors.subject; ok = false; }
    if (!form.message.trim()) { e.message = text.errors.message; ok = false; }
    setErrors(e);
    return ok;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      await axios.post(`${API_BASE_URL}/api/contact`, {
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setStatus("success");
      setForm(INIT);
      setErrors(INIT_ERRORS);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        text.errors.submit
      );
    }
  }

  function handleOpen() {
    setOpen(true);
    setStatus("idle");
    setErrorMsg("");
  }

  function handleClose() {
    setOpen(false);
    if (status === "success" || status === "error") {
      setStatus("idle");
      setErrorMsg("");
    }
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed top-1/2 left-24 z-50 w-[360px] translate-y-[calc(-50%+30px)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: "560px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="font-semibold text-sm">{text.title}</span>
            </div>
            <button onClick={handleClose}
              className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">

            {/* Success state */}
            {status === "success" && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
                <p className="font-semibold text-slate-800">{text.sent}</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {text.sentBody}<br />
                  {text.response}
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-2 text-sm text-orange-500 hover:underline">
                  {text.sendAnother}
                </button>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            {status !== "success" && (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {text.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={text.namePlaceholder}
                    className={`w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 outline-none transition-colors
                      ${errors.name
                        ? "border-red-400 focus:border-red-400"
                        : "border-slate-200 focus:border-orange-400"}`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {text.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 outline-none transition-colors
                      ${errors.email
                        ? "border-red-400 focus:border-red-400"
                        : "border-slate-200 focus:border-orange-400"}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {text.phone} <span className="text-slate-400">({text.optional})</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912 345 678"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-orange-400 transition-colors"
                  />
                </div>

                {/* Contact reason */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {text.reason} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className={`w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 outline-none appearance-none transition-colors pr-8
                        ${errors.subject
                          ? "border-red-400 focus:border-red-400"
                          : "border-slate-200 focus:border-orange-400"}`}
                    >
                      <option value="">{text.selectReason}</option>
                      {SUBJECTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label[language]}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.subject && (
                    <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {text.message} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder={text.messagePlaceholder}
                    className={`w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 outline-none resize-none transition-colors
                      ${errors.message
                        ? "border-red-400 focus:border-red-400"
                        : "border-slate-200 focus:border-orange-400"}`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {text.sending}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {text.send}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={text.aria}
        className="fixed top-1/2 left-6 z-50 h-14 w-14 translate-y-[38px] rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group">
        {open
          ? <X className="h-6 w-6" />
          : <Mail className="h-6 w-6 group-hover:scale-110 transition-transform" />
        }
        {!open && (
          <span className="absolute -top-10 left-0 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {text.contact}
          </span>
        )}
      </button>
    </>
  );
}
