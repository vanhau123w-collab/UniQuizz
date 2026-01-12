# ShareButton Component - Testing Guide

## ✅ Tính năng đã implement

### **1. Share Methods**
- ✅ Facebook Share
- ✅ Twitter Share
- ✅ Zalo Share
- ✅ Telegram Share
- ✅ Copy Link
- ✅ Web Share API (Mobile)

### **2. UI Features**
- ✅ Dropdown menu với backdrop
- ✅ Social media icons với brand colors
- ✅ Copy confirmation feedback
- ✅ Link preview
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Smooth animations

### **3. Analytics Integration**
- ✅ Track share events
- ✅ Track share method (facebook, twitter, etc.)
- ✅ Track quiz ID

---

## 🧪 Testing Checklist

### **Desktop Testing:**
```
1. Click "Chia sẻ" button
   ✓ Menu opens
   ✓ Backdrop appears
   
2. Click Facebook
   ✓ Opens Facebook share dialog
   ✓ URL is correct
   ✓ Menu closes
   
3. Click Twitter
   ✓ Opens Twitter share dialog
   ✓ Text and URL are correct
   ✓ Menu closes
   
4. Click Zalo
   ✓ Opens Zalo share page
   ✓ URL is correct
   
5. Click Telegram
   ✓ Opens Telegram share
   ✓ Text and URL are correct
   
6. Click Copy Link
   ✓ Shows "Đã copy!" feedback
   ✓ Link is in clipboard
   ✓ Menu closes after 2s
   
7. Click backdrop
   ✓ Menu closes
```

### **Mobile Testing:**
```
1. Check Web Share API button
   ✓ Button appears on mobile
   ✓ Opens native share sheet
   ✓ Can share to any app
   
2. Test all social buttons
   ✓ Work on mobile browsers
   ✓ Open in new tab/app
```

### **Dark Mode Testing:**
```
1. Toggle dark mode
   ✓ Menu background changes
   ✓ Text colors adjust
   ✓ Icons remain visible
   ✓ Hover states work
```

---

## 📱 Usage Examples

### **In QuizCard:**
```jsx
import ShareButton from "./ShareButton";

<ShareButton 
  quiz={{ _id: quiz.id, title: quiz.title }} 
  type="quiz" 
/>
```

### **In FlashcardCard:**
```jsx
<ShareButton 
  quiz={{ _id: flashcard.id, title: flashcard.title }} 
  type="flashcard" 
/>
```

### **Custom Position:**
```jsx
<div className="flex justify-end">
  <ShareButton quiz={quiz} type="quiz" />
</div>
```

---

## 🎨 Customization

### **Change Button Style:**
```jsx
// In ShareButton.jsx, modify button className
className="flex items-center gap-2 px-4 py-2 bg-green-600 ..."
```

### **Add More Share Methods:**
```jsx
// Add new button in menu
<button onClick={shareToWhatsApp}>
  <div className="w-10 h-10 rounded-full bg-[#25D366]">
    {/* WhatsApp icon */}
  </div>
  <div>
    <p>WhatsApp</p>
  </div>
</button>

// Add handler
const shareToWhatsApp = () => {
  const text = encodeURIComponent(shareDescription);
  const url = `https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl)}`;
  window.open(url, "_blank");
  analytics.shareQuiz("whatsapp", quiz._id);
  setShowMenu(false);
};
```

### **Change Share Text:**
```jsx
// Modify shareDescription
const shareDescription = `Tham gia làm quiz "${quiz.title}" trên UniQuizz! 🎓`;
```

---

## 🔧 Troubleshooting

### **Copy không hoạt động:**
```
Nguyên nhân: Browser không hỗ trợ Clipboard API
Giải pháp: Đã có fallback với document.execCommand
```

### **Web Share API không xuất hiện:**
```
Nguyên nhân: Chỉ có trên HTTPS và mobile
Giải pháp: Test trên HTTPS hoặc localhost
```

### **Social share không mở:**
```
Nguyên nhân: Popup bị block
Giải pháp: Cho phép popup trong browser settings
```

---

## 📊 Analytics Events

### **Tracked Events:**
```javascript
analytics.shareQuiz("facebook", quizId);
analytics.shareQuiz("twitter", quizId);
analytics.shareQuiz("zalo", quizId);
analytics.shareQuiz("telegram", quizId);
analytics.shareQuiz("copy_link", quizId);
analytics.shareQuiz("web_share", quizId);
```

### **View in Google Analytics:**
```
Events → share
Parameters:
  - method: facebook/twitter/zalo/etc.
  - content_type: quiz
  - content_id: quiz123
```

---

## 🎯 Best Practices

### **1. Placement:**
- ✅ Top-right của card
- ✅ Không che title
- ✅ Dễ click

### **2. UX:**
- ✅ Feedback khi copy
- ✅ Close menu sau action
- ✅ Backdrop để close
- ✅ Loading states (nếu cần)

### **3. Accessibility:**
- ✅ aria-label cho button
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ Screen reader friendly

---

## 🚀 Future Enhancements

### **Có thể thêm:**
1. WhatsApp share
2. Email share
3. QR code generation
4. Share count display
5. Share rewards (gamification)
6. Custom share images (OG image)
7. Share to LinkedIn
8. Share to Reddit

---

## 📝 Notes

- Web Share API chỉ hoạt động trên HTTPS
- Facebook share cần Open Graph tags (đã có trong index.html)
- Twitter share cần Twitter Card tags (đã có)
- Copy link có fallback cho browser cũ
- Analytics tracking tự động

---

## ✨ Summary

ShareButton component đã hoàn chỉnh với:
- 6 share methods
- Analytics tracking
- Dark mode support
- Mobile responsive
- Copy feedback
- Professional UI

**Ready for production!** 🎉
