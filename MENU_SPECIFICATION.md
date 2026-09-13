# TÀI LIỆU KỸ THUẬT: ĐẶC TẢ MENU ĐỘNG & THIẾT KẾ DATABASE (CHUẨN MỞ RỘNG ĐA ICON)

**Dự án**: Metronic Admin Template v9.5.0 / INJ Admin Dashboard  
**Ngày cập nhật**: 03/09/2026  
**Tiêu chuẩn Icon**: Universal Namespaced Prefix (`provider:name`)

---

## 1. Tổng quan Kiến trúc Menu

Hệ thống Menu được xây dựng theo mô hình phân cấp dạng cây (Recursive Tree), dữ liệu được quản lý tập trung từ Database Backend và cung cấp động cho Frontend thông qua REST API.

Frontend phân giải dữ liệu menu cho các component:

- **Sidebar Menu**: [`AccordionMenu`](file:///e:/MyProject/MetronicTemplate/V9.5.0/src/components/ui/accordion-menu.tsx) (hỗ trợ đóng/mở cấp con, co giãn sidebar, active indicator).
- **Navbar Menu**: [`NavbarMenu`](file:///e:/MyProject/MetronicTemplate/V9.5.0/src/partials/navbar/navbar-menu.tsx) (dạng menu ngang, dropdown sub).

---

## 2. Tiêu chuẩn Lưu trữ Đa Icon trong Database (`icon` field)

Thay vì cố định một thư viện duy nhất, trường `icon` sử dụng **chuẩn định danh Namespace Prefix (`provider:icon_name`)**. Định dạng này gọn gàng (chỉ 1 cột `VARCHAR(255)`), dễ mở rộng cho hàng chục thư viện icon khác nhau mà không bao giờ cần thay đổi cấu trúc bảng.

### 📋 Bảng quy ước định dạng Icon:

| Thư viện Icon                | Cú pháp lưu trong DB                        | Ví dụ thực tế                                                               | Ghi chú                                                              |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Lucide Icons**             | `lucide:<name>`                             | `lucide:LayoutGrid`<br>`lucide:Users`                                       | Bộ icon mặc định, hỗ trợ cả khi chỉ ghi `LayoutGrid`                 |
| **Metronic KeenIcons**       | `keen:<style>:<name>`<br>hoặc `keen:<name>` | `keen:duotone:element-11`<br>`keen:outline:user`<br>`keen:filled:setting-2` | Icon độc quyền Metronic, hỗ trợ style `duotone`, `outline`, `filled` |
| **Remix Icons**              | `remix:<name>`                              | `remix:RiDashboardLine`<br>`remix:RiShieldCheckLine`                        | Bộ icon `@remixicon/react`                                           |
| **FontAwesome**              | `fa:<classes>`                              | `fa:fa-solid fa-chart-line`<br>`fa:fa-brands fa-github`                     | FontAwesome font class                                               |
| **Iconify** (200,000+ icons) | `iconify:<collection>:<name>`               | `iconify:solar:shield-bold`<br>`iconify:mdi:cart-outline`                   | Hỗ trợ Solar, Material, Carbon, Tabler...                            |
| **Custom SVG File**          | `svg:<url>`                                 | `svg:/media/icons/custom.svg`<br>`svg:https://cdn.domain.com/icon.svg`      | File SVG tải lên hoặc icon thương hiệu riêng                         |

---

## 3. Thiết kế Database Schema

### 3.1. Bảng `menus`

| Tên trường (Column) | Kiểu dữ liệu     | Nullable | Mặc định       | Ý nghĩa & Mô tả                                                                                       |
| ------------------- | ---------------- | :------: | -------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                | `INT` / `UUID`   |    ❌    | Auto Increment | Khóa chính                                                                                            |
| `parent_id`         | `INT` / `UUID`   |    ✅    | `NULL`         | Khóa ngoại tự trỏ `menus(id)` (`NULL` = Menu cấp 1)                                                   |
| `type`              | `VARCHAR(20)`    |    ❌    | `'item'`       | Loại menu: `'item'` (mục link/menu cha), `'heading'` (tiêu đề nhóm), `'separator'` (đường gạch ngang) |
| `title`             | `VARCHAR(100)`   |    ✅    | `NULL`         | Tên hiển thị của menu                                                                                 |
| `path`              | `VARCHAR(255)`   |    ✅    | `NULL`         | Đường dẫn route (để `NULL` nếu là menu cha chỉ toggle)                                                |
| `icon`              | `VARCHAR(255)`   |    ✅    | `NULL`         | Chuỗi icon chuẩn prefix (vd: `keen:duotone:element-11`, `lucide:Users`)                               |
| `heading`           | `VARCHAR(100)`   |    ✅    | `NULL`         | Tên tiêu đề phân nhóm nếu `type = 'heading'`                                                          |
| `badge`             | `VARCHAR(30)`    |    ✅    | `NULL`         | Nhãn nhỏ ở đuôi (vd: `'New'`, `'Pro'`, `'12'`)                                                        |
| `badge_variant`     | `VARCHAR(20)`    |    ✅    | `'primary'`    | Kiểu màu badge (`primary`, `success`, `destructive`...)                                               |
| `permission`        | `VARCHAR(100)`   |    ✅    | `NULL`         | Mã quyền yêu cầu (vd: `'users:view'`, `'payroll:approve'`) — _Tích hợp với Auth NestJS_               |
| `roles`             | `JSON` / `JSONB` |    ✅    | `'[]'`         | Mảng roles được xem (vd: `["admin", "manager"]`)                                                      |
| `order_index`       | `INT`            |    ❌    | `0`            | Thứ tự sắp xếp từ nhỏ đến lớn (1, 2, 3...)                                                            |
| `is_active`         | `BOOLEAN`        |    ❌    | `true`         | Trạng thái hiển thị (`true`: bật, `false`: ẩn)                                                        |
| `is_external`       | `BOOLEAN`        |    ❌    | `false`        | Có phải liên kết ngoài không (`target="_blank"`)                                                      |
| `created_at`        | `TIMESTAMP`      |    ❌    | `NOW()`        | Thời gian tạo                                                                                         |
| `updated_at`        | `TIMESTAMP`      |    ❌    | `NOW()`        | Thời gian cập nhật                                                                                    |

---

### 3.2. Mã lệnh DDL SQL hoàn chỉnh

#### PostgreSQL:

```sql
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES menus(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'item' CHECK (type IN ('item', 'heading', 'separator')),
    title VARCHAR(100),
    path VARCHAR(255),
    icon VARCHAR(255), -- Chuẩn namespace prefix
    heading VARCHAR(100),
    badge VARCHAR(30),
    badge_variant VARCHAR(20) DEFAULT 'primary',
    permission VARCHAR(100),
    roles JSONB DEFAULT '[]'::jsonb,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_external BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menus_parent_id ON menus(parent_id);
CREATE INDEX idx_menus_order ON menus(order_index);
CREATE INDEX idx_menus_active ON menus(is_active);
```

#### MySQL / MariaDB:

```sql
CREATE TABLE `menus` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `parent_id` INT NULL,
    `type` ENUM('item', 'heading', 'separator') DEFAULT 'item',
    `title` VARCHAR(100) NULL,
    `path` VARCHAR(255) NULL,
    `icon` VARCHAR(255) NULL, -- Chuẩn namespace prefix
    `heading` VARCHAR(100) NULL,
    `badge` VARCHAR(30) NULL,
    `badge_variant` VARCHAR(20) DEFAULT 'primary',
    `permission` VARCHAR(100) NULL,
    `roles` JSON NULL,
    `order_index` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_external` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `menus`(`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_menus_parent_id` ON `menus`(`parent_id`);
CREATE INDEX `idx_menus_order` ON `menus`(`order_index`);
CREATE INDEX `idx_menus_active` ON `menus`(`is_active`);
```

---

## 4. Dữ liệu Mẫu (Seed Data Đa Icon)

```sql
-- 1. Mục Dashboard (Dùng Lucide Icon)
INSERT INTO menus (id, parent_id, type, title, path, icon, order_index, is_active)
VALUES (1, NULL, 'item', 'Dashboards', '/', 'lucide:LayoutGrid', 1, TRUE);

-- 2. Phân nhóm Heading
INSERT INTO menus (id, parent_id, type, heading, order_index, is_active)
VALUES (2, NULL, 'heading', 'Quản lý nghiệp vụ', 2, TRUE);

-- 3. Mục Quản lý nhân sự (Dùng Metronic KeenIcon Duotone)
INSERT INTO menus (id, parent_id, type, title, path, icon, permission, order_index, is_active)
VALUES (3, NULL, 'item', 'Nhân sự', NULL, 'keen:duotone:profile-user', 'users:view', 3, TRUE);

-- 4. Các mục con của "Nhân sự"
INSERT INTO menus (id, parent_id, type, title, path, icon, permission, order_index, is_active)
VALUES
(4, 3, 'item', 'Danh sách nhân viên', '/users/list', 'lucide:Users', 'users:view', 1, TRUE),
(5, 3, 'item', 'Bảng lương', '/payroll', 'remix:RiMoneyDollarCircleLine', 'payroll:approve', 2, TRUE);

-- 5. Mục Cài đặt (Dùng SVG ngoài hoặc FontAwesome)
INSERT INTO menus (id, parent_id, type, title, path, icon, roles, badge, order_index, is_active)
VALUES (6, NULL, 'item', 'Cài đặt hệ thống', '/settings', 'keen:duotone:setting-2', '["admin"]', 'Pro', 4, TRUE);
```

---

## 5. Xử lý Phân giải Icon trên Frontend (Universal Parser)

### 5.1. Component `<UniversalIcon />`

Tạo file: `src/components/common/universal-icon.tsx`

```tsx
import React from 'react';
import * as RemixIcons from '@remixicon/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components/keenicons';

interface UniversalIconProps {
  icon?: string | React.ComponentType<any> | React.ReactNode;
  className?: string;
}

export function UniversalIcon({
  icon,
  className = 'size-4.5',
}: UniversalIconProps) {
  if (!icon) return null;

  // Nếu truyền trực tiếp React Component / Element
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && React.isValidElement(icon))
  ) {
    const IconComp = icon as React.ComponentType<any>;
    return <IconComp className={className} />;
  }

  if (typeof icon === 'string') {
    // 1. Phân tách prefix: "provider:param1:param2"
    if (icon.includes(':')) {
      const parts = icon.split(':');
      const provider = parts[0].toLowerCase();

      // A. Metronic KeenIcon -> "keen:duotone:element-11" hoặc "keen:user"
      if (provider === 'keen') {
        const style = parts.length === 3 ? (parts[1] as any) : 'outline';
        const name = parts.length === 3 ? parts[2] : parts[1];
        return <KeenIcon icon={name} style={style} className={className} />;
      }

      // B. Remix Icon -> "remix:RiDashboardLine"
      if (provider === 'remix' || provider === 'ri') {
        const name = parts[1];
        const RemixComp = (RemixIcons as Record<string, any>)[name];
        if (RemixComp) return <RemixComp className={className} />;
      }

      // C. File SVG -> "svg:/media/icons/logo.svg"
      if (provider === 'svg' || icon.endsWith('.svg')) {
        const url = parts.slice(1).join(':');
        return (
          <img src={url} alt="" className={cn(className, 'object-contain')} />
        );
      }

      // D. FontAwesome class -> "fa:fa-solid fa-user"
      if (provider === 'fa' || provider === 'fontawesome') {
        const iconClasses = parts.slice(1).join(':');
        return <i className={cn(iconClasses, className)} />;
      }

      // E. Lucide Icon -> "lucide:LayoutGrid"
      if (provider === 'lucide') {
        const name = parts[1];
        const LucideComp = (LucideIcons as Record<string, any>)[name];
        if (LucideComp) return <LucideComp className={className} />;
      }
    }

    // 2. Mặc định tra cứu trong Lucide Icons nếu không có prefix
    const DefaultLucide = (LucideIcons as Record<string, any>)[icon];
    if (DefaultLucide) {
      return <DefaultLucide className={className} />;
    }
  }

  // Fallback icon mặc định
  return <LucideIcons.Circle className={className} />;
}
```

---

## 6. Dựng cây Menu và Lọc quyền Người dùng

```typescript
import { MenuConfig, MenuItem } from '@/config/types';

export interface DBMenuItem {
  id: number;
  parent_id: number | null;
  type: 'item' | 'heading' | 'separator';
  title?: string;
  path?: string;
  icon?: string;
  heading?: string;
  badge?: string;
  permission?: string;
  roles?: string[];
  is_active: boolean;
}

export function buildDynamicMenuTree(
  rawList: DBMenuItem[],
  userPermissions: string[] = [],
  userRoles: string[] = [],
): MenuConfig {
  const nodeMap = new Map<number, any>();
  const rootItems: MenuConfig = [];

  // Lọc theo trạng thái và phân quyền
  const allowedItems = rawList.filter((item) => {
    if (!item.is_active) return false;

    // Kiểm tra permission
    if (item.permission && !userPermissions.includes(item.permission)) {
      return false;
    }

    // Kiểm tra roles
    if (item.roles && item.roles.length > 0) {
      const matchRole = item.roles.some((r) => userRoles.includes(r));
      if (!matchRole) return false;
    }

    return true;
  });

  // Khởi tạo các node
  allowedItems.forEach((item) => {
    nodeMap.set(item.id, {
      title: item.title,
      heading: item.heading,
      path: item.path,
      icon: item.icon, // Giữ nguyên chuỗi prefix để UniversalIcon render
      badge: item.badge,
      separator: item.type === 'separator',
      children: [],
    });
  });

  // Ghép nối quan hệ cha - con
  allowedItems.forEach((item) => {
    const currentNode = nodeMap.get(item.id)!;
    if (item.parent_id && nodeMap.has(item.parent_id)) {
      const parentNode = nodeMap.get(item.parent_id)!;
      parentNode.children.push(currentNode);
    } else {
      rootItems.push(currentNode);
    }
  });

  // Dọn dẹp mảng children rỗng
  const cleanup = (nodes: any[]) => {
    nodes.forEach((n) => {
      if (n.children && n.children.length === 0) {
        delete n.children;
      } else if (n.children) {
        cleanup(n.children);
      }
    });
  };

  cleanup(rootItems);
  return rootItems;
}
```

---

## 7. Các Lưu ý & Khuyến nghị Thực tế (Best Practices)

1. **Validation ở Backend (NestJS DTO)**:
   - Sử dụng Regex để kiểm tra tính hợp lệ của tiền tố trước khi lưu vào DB:
     ```typescript
     @IsOptional()
     @Matches(/^(lucide|keen|remix|fa|iconify|svg):.+$/, {
       message: 'Icon phải theo định dạng provider:name (vd: keen:duotone:user, lucide:Users)',
     })
     icon?: string;
     ```

2. **Trải nghiệm Quản trị (Admin UI)**:
   - Nên xây dựng **Icon Picker Modal** trên trang Admin để người dùng chỉ cần click chọn icon trực quan, hệ thống tự động sinh chuỗi prefix tương ứng mà không phải gõ tay.

3. **Tối ưu Hiệu năng & Dung lượng Bundle**:
   - Với các icon đặc thù hoặc bộ icon quá lớn, ưu tiên sử dụng **Icon Font (KeenIcons, FontAwesome)** hoặc **Iconify** để tải icon theo nhu cầu (On-demand), tránh làm phình to kích thước file JS của Frontend.
