const db = require('../config/db');

// 1. Lấy danh sách tất cả sản phẩm (Dành cho Admin hoặc quản lý chung)
exports.getAllProducts = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        // Lấy số trang và số lượng item trên 1 trang từ query (mặc định trang 1, 10 sản phẩm/trang)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 1. Tính tổng số sản phẩm trong bảng Products
        const [countRows] = await db.query(`SELECT COUNT(*) as total FROM Products`);
        const totalItems = countRows[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 2. Lấy danh sách sản phẩm theo giới hạn phân trang
        const [products] = await db.query(`
            SELECT p.*, 
                   b.Name as BrandName, 
                   c1.Name as CategoryName, 
                   c2.Name as SubCategoryName
            FROM Products p
            LEFT JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN Categories c1 ON p.CategoryID = c1.CategoryID
            LEFT JOIN Categories c2 ON p.SubCategoryID = c2.CategoryID
            ORDER BY p.UpdatedAt DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // 3. Lấy thêm Flavors và Goals cho từng sản phẩm trong trang hiện tại
        for (let product of products) {
            const [flavors] = await db.query(
                'SELECT FlavorID, FlavorName, Stock FROM ProductFlavors WHERE ProductID = ?', 
                [product.ProductID]
            );
            
            const [goals] = await db.query(`
                SELECT g.GoalID, g.Name, g.Slug 
                FROM ProductGoals pg 
                JOIN Goals g ON pg.GoalID = g.GoalID 
                WHERE pg.ProductID = ?
            `, [product.ProductID]);

            product.Flavors = flavors;
            product.Goals = goals;
        }

        // 4. Trả về dữ liệu kèm thông tin phân trang chuẩn Offset-Based
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 1.1. Lấy danh sách sản phẩm cho Khách hàng với phân trang Cursor-Based (Cuộn vô tận / Xem thêm)
exports.getCustomerProducts = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const limit = parseInt(req.query.limit) || 12;
        const categoryParam = req.query.category || req.query.slug;
        
        let lastId = req.query.lastId;
        if (!lastId && req.query.cursor) {
            const cursor = req.query.cursor;
            if (typeof cursor === 'object' && cursor !== null) {
                lastId = cursor.lastId || cursor.lastProductId;
            } else if (typeof cursor === 'string') {
                try {
                    const parsed = JSON.parse(cursor);
                    lastId = parsed.lastId || parsed.lastProductId;
                } catch (e) {
                    lastId = cursor;
                }
            }
        }

        // 1. Xử lý logic gom ID danh mục
        let targetCategoryIds = [];
        if (categoryParam && categoryParam !== 'thuc-pham-bo-sung' && categoryParam !== 'all') {
            let catRows = [];
            if (!isNaN(categoryParam)) {
                [catRows] = await db.query('SELECT * FROM Categories WHERE CategoryID = ?', [categoryParam]);
            } else {
                [catRows] = await db.query('SELECT * FROM Categories WHERE Slug = ?', [categoryParam]);
            }

            if (catRows.length > 0) {
                const currentCat = catRows[0];
                targetCategoryIds.push(currentCat.CategoryID);

                const [subCats] = await db.query('SELECT CategoryID FROM Categories WHERE ParentCategoryID = ?', [currentCat.CategoryID]);
                subCats.forEach(sub => targetCategoryIds.push(sub.CategoryID));
            }
        }

        // 🎯 THÊM: Tính tổng số lượng sản phẩm thỏa mãn điều kiện danh mục (chưa phân trang)
        let countQuery = `SELECT COUNT(*) as total FROM Products p WHERE p.status = 1`;
        let countParams = [];
        if (targetCategoryIds.length > 0) {
            const placeholders = targetCategoryIds.map(() => '?').join(',');
            countQuery += ` AND (p.CategoryID IN (${placeholders}) OR p.SubCategoryID IN (${placeholders}))`;
            countParams.push(...targetCategoryIds, ...targetCategoryIds);
        }
        const [countRows] = await db.query(countQuery, countParams);
        const totalProducts = countRows[0]?.total || 0;

        // 2. Xây dựng câu lệnh SQL truy vấn sản phẩm (phân trang)
        let query = `
            SELECT p.*, 
                   b.Name as BrandName, 
                   c1.Name as CategoryName, 
                   c2.Name as SubCategoryName
            FROM Products p
            LEFT JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN Categories c1 ON p.CategoryID = c1.CategoryID
            LEFT JOIN Categories c2 ON p.SubCategoryID = c2.CategoryID
            WHERE p.status = 1
        `;
        let queryParams = [];

        if (targetCategoryIds.length > 0) {
            const placeholders = targetCategoryIds.map(() => '?').join(',');
            query += ` AND (p.CategoryID IN (${placeholders}) OR p.SubCategoryID IN (${placeholders}))`;
            queryParams.push(...targetCategoryIds, ...targetCategoryIds);
        }

        if (lastId) {
            query += ` AND p.ProductID < ?`;
            queryParams.push(lastId);
        }

        query += ` ORDER BY p.ProductID DESC LIMIT ?`;
        queryParams.push(limit + 1);

        const [rows] = await db.query(query, queryParams);

        let hasMore = false;
        if (rows.length > limit) {
            hasMore = true;
            rows.pop();
        }

        for (let product of rows) {
            const [flavors] = await db.query(
                'SELECT FlavorID, FlavorName, Stock FROM ProductFlavors WHERE ProductID = ?', 
                [product.ProductID]
            );
            
            const [goals] = await db.query(`
                SELECT g.GoalID, g.Name, g.Slug 
                FROM ProductGoals pg 
                JOIN Goals g ON pg.GoalID = g.GoalID 
                WHERE pg.ProductID = ?
            `, [product.ProductID]);

            product.Flavors = flavors;
            product.Goals = goals;
        }

        const nextCursor = rows.length > 0 ? {
            lastId: rows[rows.length - 1].ProductID
        } : null;

        res.json({
            success: true,
            data: rows,
            pagination: {
                hasMore,
                nextCursor,
                total: totalProducts // 🎯 Trả về tổng số sản phẩm
            }
        });
    } catch (error) {
        console.error('Lỗi lấy sản phẩm phân trang cursor cho khách hàng:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 2. Lấy chi tiết 1 sản phẩm theo ProductID
exports.getProductById = async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id).trim();

        const [rows] = await db.query(`
            SELECT p.*, 
                   b.Name as BrandName, 
                   c1.Name as CategoryName, 
                   c2.Name as SubCategoryName
            FROM Products p
            LEFT JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN Categories c1 ON p.CategoryID = c1.CategoryID
            LEFT JOIN Categories c2 ON p.SubCategoryID = c2.CategoryID
            WHERE TRIM(p.ProductID) = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
        }

        const product = rows[0];

        const [flavors] = await db.query('SELECT FlavorID, FlavorName, Stock FROM ProductFlavors WHERE TRIM(ProductID) = ?', [id]);
        
        const [goals] = await db.query(`
            SELECT g.GoalID, g.Name, g.Slug 
            FROM ProductGoals pg 
            JOIN Goals g ON pg.GoalID = g.GoalID 
            WHERE TRIM(pg.ProductID) = ?
        `, [id]);

        product.Flavors = flavors;
        product.Goals = goals;

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 3. Thêm mới sản phẩm (Dùng Transaction)
exports.createProduct = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            ProductID,
            Name,
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image,
            Status = true,
            Flavors = [],
            Goals = []
        } = req.body;

        if (!ProductID || !Name || !BrandID || !CategoryID || !SubCategoryID || Price === undefined) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc của sản phẩm!' });
        }

        const [existing] = await connection.query('SELECT ProductID FROM Products WHERE ProductID = ?', [ProductID]);
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: `Mã sản phẩm (ProductID) "${ProductID}" đã tồn tại!` });
        }

        const productSql = `
            INSERT INTO Products
            (ProductID, Name, BrandID, CategoryID, SubCategoryID, Price, Image, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(productSql, [
            ProductID.trim(),
            Name.trim(),
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image ? Image.trim() : null,
            Status
        ]);

        if (Array.isArray(Flavors) && Flavors.length > 0) {
            for (const flavor of Flavors) {
                if (flavor.FlavorName || flavor.flavorName) {
                    const fName = flavor.FlavorName || flavor.flavorName;
                    const fStock = flavor.Stock !== undefined ? flavor.Stock : (flavor.stock || 0);
                    await connection.query(
                        'INSERT INTO ProductFlavors (ProductID, FlavorName, Stock) VALUES (?, ?, ?)',
                        [ProductID.trim(), fName.trim(), fStock]
                    );
                }
            }
        }

        if (Array.isArray(Goals) && Goals.length > 0) {
            for (const goalID of Goals) {
                await connection.query(
                    'INSERT INTO ProductGoals (ProductID, GoalID) VALUES (?, ?)',
                    [ProductID.trim(), goalID]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm thành công!',
            data: { ProductID, Name }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Lỗi server khi thêm sản phẩm:', error);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi hệ thống khi thêm sản phẩm.' });
    }
};

// 4. Cập nhật sản phẩm theo ProductID
exports.updateProduct = async (req, res) => {
    const productIdFromUrl = decodeURIComponent(req.params.id).trim();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existingProducts] = await connection.query(
            'SELECT ProductID FROM Products WHERE TRIM(ProductID) = ?',
            [productIdFromUrl]
        );

        if (existingProducts.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm cần cập nhật!'
            });
        }

        const targetProductID = existingProducts[0].ProductID;

        const {
            Name,
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image,
            Status,
            Flavors = [],
            Goals = []
        } = req.body;

        if (
            Name === undefined &&
            BrandID === undefined &&
            CategoryID === undefined &&
            SubCategoryID === undefined &&
            Price === undefined &&
            Status !== undefined
        ) {
            await connection.query(
                `
                UPDATE Products
                SET
                    status = ?,
                    UpdatedAt = NOW()
                WHERE ProductID = ?
                `,
                [Status ? 1 : 0, targetProductID]
            );

            await connection.commit();
            connection.release();

            return res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công!'
            });
        }

        if (!Name || !BrandID || !CategoryID || !SubCategoryID || Price === undefined) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!'
            });
        }

        await connection.query(
            `
            UPDATE Products
            SET
                Name = ?,
                BrandID = ?,
                CategoryID = ?,
                SubCategoryID = ?,
                Price = ?,
                Image = ?,
                status = ?,
                UpdatedAt = NOW()
            WHERE ProductID = ?
            `,
            [
                Name.trim(),
                BrandID,
                CategoryID,
                SubCategoryID,
                Number(Price),
                Image ? Image.trim() : null,
                Status ? 1 : 0,
                targetProductID
            ]
        );

        await connection.query(
            'DELETE FROM ProductFlavors WHERE ProductID = ?',
            [targetProductID]
        );

        if (Array.isArray(Flavors)) {
            for (const flavor of Flavors) {
                const flavorName = flavor.FlavorName || flavor.flavorName;
                const stock = flavor.Stock !== undefined ? flavor.Stock : (flavor.stock || 0);

                if (!flavorName) continue;

                await connection.query(
                    `
                    INSERT INTO ProductFlavors (ProductID, FlavorName, Stock)
                    VALUES (?, ?, ?)
                    `,
                    [
                        targetProductID,
                        String(flavorName).trim(),
                        Number(stock) || 0
                    ]
                );
            }
        }

        await connection.query(
            'DELETE FROM ProductGoals WHERE ProductID = ?',
            [targetProductID]
        );

        if (Array.isArray(Goals)) {
            for (const goal of Goals) {
                const goalID = typeof goal === "object" ? goal.GoalID : goal;

                if (!goalID) continue;

                await connection.query(
                    `
                    INSERT INTO ProductGoals (ProductID, GoalID)
                    VALUES (?, ?)
                    `,
                    [targetProductID, Number(goalID)]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công!'
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error('Lỗi server khi cập nhật sản phẩm:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 5. Xóa sản phẩm theo ProductID
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM Products WHERE ProductID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa!' });
        }

        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công!'
        });
    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};