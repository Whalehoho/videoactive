# ---------- Build Stage ----------
    FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
    WORKDIR /app
    
    # Copy csproj and restore first to cache dependencies
    COPY *.csproj ./
    RUN dotnet restore
    
    # Copy everything and publish
    COPY . ./
    RUN dotnet publish -c Release -o /app/out
    
    # ---------- Runtime Stage ----------
    FROM mcr.microsoft.com/dotnet/aspnet:8.0
    WORKDIR /app
    
    COPY --from=build /app/out ./
    
    # Expose port used in the app
    EXPOSE 5000
    
    ENTRYPOINT ["dotnet", "VideoActive.dll"]
    